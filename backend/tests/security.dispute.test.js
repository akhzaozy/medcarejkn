import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash, randomBytes } from 'node:crypto';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

test('SEC-01: Dispute Endpoint Role-Based Authorization, Strict allowRevision, & Final Status Hardening', async () => {
  const database = `jkn_sec01_test_${Date.now()}`;
  const admin = new pg.Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    database: 'postgres',
    password: process.env.DB_PASSWORD || undefined
  });

  await admin.connect();
  await admin.query(`CREATE DATABASE "${database}"`);
  await admin.end();

  process.env.DB_NAME = database;
  const password = randomUUID();
  process.env.JKN_STAFF_PASSWORD_HASH = await bcrypt.hash(password, 4);
  process.env.JKN_CLINICIAN_PASSWORD_HASH = await bcrypt.hash(password, 4);

  const { default: pool } = await import('../src/config/db.js');
  const { migrate } = await import('../src/scripts/migrate.js');
  const { default: app } = await import('../src/app.js');
  const { recordCaseAction, submitCaseOutcome } = await import('../src/services/caseService.js');
  const { createSession } = await import('../src/auth/session.js');

  let server;
  try {
    const migrationResult = await migrate();
    assert.equal(migrationResult.status, 'migrated');

    server = await new Promise(resolve => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const base = `http://127.0.0.1:${server.address().port}/api`;

    // Helper function for API calls
    async function apiCall(path, { token, body, method = body ? 'POST' : 'GET' } = {}) {
      const res = await fetch(base + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      let responseBody;
      try {
        responseBody = await res.json();
      } catch {
        responseBody = null;
      }
      return { status: res.status, body: responseBody };
    }

    // Helper functions for assertions
    const countDocs = async (caseId, kind = 'dispute') => {
      const res = await pool.query('SELECT COUNT(*) n FROM case_documents WHERE case_id=$1 AND kind=$2', [caseId, kind]);
      return Number(res.rows[0].n);
    };
    const countAudits = async (caseId, action = 'DISPUTE_SUBMITTED') => {
      const res = await pool.query('SELECT COUNT(*) n FROM audit_logs WHERE case_id=$1 AND action=$2', [caseId, action]);
      return Number(res.rows[0].n);
    };
    const countNotifs = async (caseId, type = 'dispute') => {
      const res = await pool.query('SELECT COUNT(*) n FROM notifications WHERE case_id=$1 AND type=$2', [caseId, type]);
      return Number(res.rows[0].n);
    };
    const getCaseStatus = async (caseId) => {
      const res = await pool.query('SELECT case_status FROM cases WHERE case_id=$1', [caseId]);
      return res.rows[0]?.case_status;
    };
    const resetCaseFixture = async (caseId, targetStatus = 'CONFIRMED') => {
      await pool.query('UPDATE cases SET case_status=$1 WHERE case_id=$2', [targetStatus, caseId]);
      await pool.query('DELETE FROM case_documents WHERE case_id=$1 AND kind=$2', [caseId, 'dispute']);
      await pool.query("DELETE FROM audit_logs WHERE case_id=$1 AND action='DISPUTE_SUBMITTED'", [caseId]);
      await pool.query("DELETE FROM notifications WHERE case_id=$1 AND type='dispute'", [caseId]);
    };

    // Authenticate users
    const staffLogin = await apiCall('/auth/login', { body: { username: 'staff.ahmad', password } });
    assert.equal(staffLogin.status, 200);
    const staffToken = staffLogin.body.data.token;

    const doctorLogin = await apiCall('/auth/login', { body: { username: 'dr.anindya', password } });
    assert.equal(doctorLogin.status, 200);
    const doctorToken = doctorLogin.body.data.token;

    // Create an expired session token
    const hashToken = t => createHash('sha256').update(t).digest('hex');
    const expiredToken = randomBytes(32).toString('base64url');
    await pool.query(
      "INSERT INTO auth_sessions(token_hash, username, expires_at) VALUES($1, $2, CURRENT_TIMESTAMP - INTERVAL '1 hour')",
      [hashToken(expiredToken), 'staff.ahmad']
    );

    // Create a user with unknown/unauthorized role (e.g. auditor_eksternal)
    const unknownRoleUser = {
      id: 'USR-EXT-999',
      username: 'auditor.eksternal',
      name: 'Auditor Eksternal BPKP',
      role: 'auditor_eksternal',
      roleLabel: 'Auditor Eksternal',
      title: 'Auditor',
      unit: 'Pengawasan Eksternal'
    };
    await pool.query(
      'INSERT INTO app_users(username, profile, password_hash) VALUES($1, $2, $3)',
      [unknownRoleUser.username, JSON.stringify(unknownRoleUser), process.env.JKN_STAFF_PASSWORD_HASH]
    );
    const unknownRoleToken = await createSession(unknownRoleUser);

    // =============================================================
    // BAGIAN 1: Otorisasi Endpoint Dispute (SEC-01 Dasar)
    // =============================================================

    // SCENARIO 1: Request dispute tanpa token/session -> HTTP 401
    const s1 = await apiCall('/cases/CASE-PB-001/dispute', {
      body: { title: 'Sanggahan tanpa auth', content: 'Uji coba' }
    });
    assert.equal(s1.status, 401, 'Request tanpa token harus ditolak dengan 401');

    // SCENARIO 2: clinical_reviewer mengirim dispute -> HTTP 403
    const docsBeforeS2 = await countDocs('CASE-PB-001');
    const statusBeforeS2 = await getCaseStatus('CASE-PB-001');
    const s2 = await apiCall('/cases/CASE-PB-001/dispute', {
      token: doctorToken,
      body: { title: 'Sanggahan dari dokter', content: 'Dokter tidak boleh mengirim dispute' }
    });
    assert.equal(s2.status, 403, 'clinical_reviewer harus ditolak dengan 403');
    assert.equal(await countDocs('CASE-PB-001'), docsBeforeS2, 'Tidak ada dokumen ditambahkan pada 403');
    assert.equal(await getCaseStatus('CASE-PB-001'), statusBeforeS2, 'Status kasus tidak berubah pada 403');

    // SCENARIO 3: clinical_reviewer mengirim dispute dengan allowRevision: true -> HTTP 403
    const s3 = await apiCall('/cases/CASE-PB-004/dispute', {
      token: doctorToken,
      body: { title: 'Dokter mencoba allowRevision', content: 'Bypass attempt', allowRevision: true }
    });
    assert.equal(s3.status, 403, 'clinical_reviewer dengan allowRevision: true harus tetap ditolak 403');

    // SCENARIO 4A: Malformed / token tidak valid -> HTTP 401
    const s4a = await apiCall('/cases/CASE-PB-001/dispute', {
      token: 'fake-invalid-token-1234567890123456789012345678901234567890',
      body: { title: 'Sanggahan fake token', content: 'Testing malformed token' }
    });
    assert.equal(s4a.status, 401, 'Token tidak valid/malformed harus ditolak 401');

    // SCENARIO 4B: Token sesi kadaluarsa -> HTTP 401
    const s4b = await apiCall('/cases/CASE-PB-001/dispute', {
      token: expiredToken,
      body: { title: 'Sanggahan expired token', content: 'Testing expired session' }
    });
    assert.equal(s4b.status, 401, 'Token sesi kadaluarsa harus ditolak 401');

    // SCENARIO 4C: Token sesi valid tapi role tidak dikenal/tidak terdaftar -> HTTP 403
    const s4c = await apiCall('/cases/CASE-PB-001/dispute', {
      token: unknownRoleToken,
      body: { title: 'Sanggahan unknown role', content: 'Testing unknown role' }
    });
    assert.equal(s4c.status, 403, 'User terautentikasi dengan role tidak berwenang harus ditolak 403');

    // SCENARIO 5: staff_jkn mengirim dispute pada kasus non-final (CASE-PB-001) -> HTTP 200
    const s5 = await apiCall('/cases/CASE-PB-001/dispute', {
      token: staffToken,
      body: {
        title: 'Surat Keberatan RS Siloam',
        content: 'Dokumen rekam medis tindakan lengkap dilampirkan.',
        actor: 'Komite Medik RS Siloam',
        role: 'Fasilitas Kesehatan (Rumah Sakit)'
      }
    });
    assert.equal(s5.status, 200, 'staff_jkn harus berhasil mengirim dispute pada kasus non-final');
    assert.equal(await getCaseStatus('CASE-PB-001'), 'RECONCILIATION', 'Status kasus harus bertransisi ke RECONCILIATION');
    assert.equal(await countDocs('CASE-PB-001'), 1, 'Dokumen dispute harus tercatat');

    // =============================================================
    // BAGIAN 2: Strict Boolean Validation pada allowRevision (TUGAS 1)
    // Kasus Final CASE-PB-004 ('CONFIRMED')
    // =============================================================
    await resetCaseFixture('CASE-PB-004', 'CONFIRMED');

    const invalidRevisionPayloads = [
      { label: 'allowRevision: false (boolean false)', value: false },
      { label: 'allowRevision: "false" (string truthy)', value: 'false' },
      { label: 'allowRevision: 1 (number truthy)', value: 1 },
      { label: 'allowRevision: {} (object truthy)', value: {} },
      { label: 'allowRevision: "true" (string "true")', value: 'true' },
      { label: 'allowRevision: null', value: null }
    ];

    for (const item of invalidRevisionPayloads) {
      const docsBefore = await countDocs('CASE-PB-004');
      const auditsBefore = await countAudits('CASE-PB-004');
      const notifsBefore = await countNotifs('CASE-PB-004');

      const res = await apiCall('/cases/CASE-PB-004/dispute', {
        token: staffToken,
        body: {
          title: `Dispute test with ${item.label}`,
          content: 'Strict boolean validation test',
          allowRevision: item.value
        }
      });

      assert.equal(
        res.status,
        409,
        `Staff JKN dengan ${item.label} harus ditolak dengan 409 pada kasus final`
      );
      assert.equal(
        await getCaseStatus('CASE-PB-004'),
        'CONFIRMED',
        `Status kasus tidak boleh berubah pada ${item.label}`
      );
      assert.equal(
        await countDocs('CASE-PB-004'),
        docsBefore,
        `Tidak boleh ada dokumen dispute tersimpan pada ${item.label}`
      );
      assert.equal(
        await countAudits('CASE-PB-004'),
        auditsBefore,
        `Tidak boleh ada audit log tersimpan pada ${item.label}`
      );
      assert.equal(
        await countNotifs('CASE-PB-004'),
        notifsBefore,
        `Tidak boleh ada notifikasi diterbitkan pada ${item.label}`
      );
    }

    // Uji sah: allowRevision: true (literal boolean) oleh Staff JKN -> HTTP 200
    const validDispute = await apiCall('/cases/CASE-PB-004/dispute', {
      token: staffToken,
      body: {
        title: 'Sanggahan resmi pembukaan kembali kasus final',
        content: 'Penemuan bukti baru rekonsiliasi formal komite medik.',
        allowRevision: true
      }
    });
    assert.equal(validDispute.status, 200, 'Staff JKN dengan allowRevision: true literal boolean harus berhasil');
    assert.equal(await getCaseStatus('CASE-PB-004'), 'RECONCILIATION', 'Kasus final bertransisi ke RECONCILIATION');

    // =============================================================
    // BAGIAN 3: Table-Driven Testing Seluruh Action pada Status Final (TUGAS 2)
    // =============================================================
    await resetCaseFixture('CASE-PB-004', 'CONFIRMED');
    assert.equal(await getCaseStatus('CASE-PB-004'), 'CONFIRMED');

    // Tabel aksi yang HARUS DITOLAK pada status final (HTTP 409) sekalipun allowRevision: true
    const finalStatusRejectActions = [
      {
        action: 'ownership',
        token: staffToken,
        endpoint: '/cases/CASE-PB-004/ownership',
        body: { allowRevision: true },
        description: 'Ownership klaim kasus final oleh Staff JKN'
      },
      {
        action: 'schedule',
        token: staffToken,
        endpoint: '/cases/CASE-PB-004/schedule',
        body: { title: 'Jadwal klarifikasi final', date: '2026-11-15', time: '10:00', allowRevision: true },
        description: 'Penjadwalan klarifikasi kasus final oleh Staff JKN'
      },
      {
        action: 'clarification',
        token: staffToken,
        endpoint: '/cases/CASE-PB-004/clarification',
        body: { title: 'Permintaan klarifikasi kasus final', reason: 'Klarifikasi lanjutan', allowRevision: true },
        description: 'Klarifikasi kasus final oleh Staff JKN'
      },
      {
        action: 'evidence (staff)',
        token: staffToken,
        endpoint: '/cases/CASE-PB-004/evidence',
        body: { title: 'Bukti susulan staf', note: 'Mencoba bypass via evidence', allowRevision: true },
        description: 'Unggah bukti langsung kasus final oleh Staff JKN'
      },
      {
        action: 'evidence (doctor)',
        token: doctorToken,
        endpoint: '/cases/CASE-PB-004/evidence',
        body: { title: 'Bukti susulan dokter', note: 'Mencoba bypass via evidence', allowRevision: true },
        description: 'Unggah bukti langsung kasus final oleh Dokter Penelaah'
      },
      {
        action: 'outcome (doctor)',
        token: doctorToken,
        endpoint: '/cases/CASE-PB-004/outcome',
        body: { outcome: 'CONFIRMED', notes: 'Putusan baru menimpa kasus final', allowRevision: true },
        description: 'Penetapan keputusan telaah klinis baru pada kasus final'
      }
    ];

    for (const testCase of finalStatusRejectActions) {
      const res = await apiCall(testCase.endpoint, {
        token: testCase.token,
        body: testCase.body
      });
      assert.equal(
        res.status,
        409,
        `Action ${testCase.action} (${testCase.description}) harus ditolak dengan HTTP 409 pada kasus final`
      );
      assert.equal(
        await getCaseStatus('CASE-PB-004'),
        'CONFIRMED',
        `Status kasus tidak boleh berubah setelah penolakan ${testCase.action}`
      );
    }

    // Uji aksi yang DIKECUALIKAN dari guard status final di kode:
    // 1. copilot (draft bantuan AI yang tidak memutasi klaim / status)
    const copilotRes = await apiCall('/cases/CASE-PB-004/copilot', {
      token: staffToken,
      body: { prompt: 'Generate evidence gap draft', allowRevision: false }
    });
    assert.equal(copilotRes.status, 200, 'Action copilot diizinkan pada status final sebagai AI draft assistant');
    assert.equal(await getCaseStatus('CASE-PB-004'), 'CONFIRMED', 'Action copilot tidak boleh memutasi status final');

    // 2. feedback (evaluasi model AI oleh dokter yang tidak memutasi klaim / status)
    const feedbackRes = await apiCall('/cases/CASE-PB-004/feedback', {
      token: doctorToken,
      body: { reason: 'Model diagnosis evaluation', note: 'AI assessment feedback' }
    });
    assert.equal(feedbackRes.status, 200, 'Action feedback diizinkan pada status final untuk feedback model AI');
    assert.equal(await getCaseStatus('CASE-PB-004'), 'CONFIRMED', 'Action feedback tidak boleh memutasi status final');

    // =============================================================
    // BAGIAN 4: Defense in Depth & Spoofing Protection
    // =============================================================
    // Reset fixture
    await resetCaseFixture('CASE-PB-004', 'CONFIRMED');

    // Uji Spoofing: Dokter mencoba menyamar dengan payload role staff_jkn
    const spoofRes = await apiCall('/cases/CASE-PB-004/dispute', {
      token: doctorToken,
      body: {
        actor: 'staff.ahmad',
        role: 'staff_jkn',
        title: 'Spoofed dispute attempt',
        content: 'Attacker trying to reopen final case',
        allowRevision: true
      }
    });
    assert.equal(spoofRes.status, 403, 'Spoofing role/actor dalam payload harus ditolak 403 berdasarkan token asli');
    assert.equal(await getCaseStatus('CASE-PB-004'), 'CONFIRMED');

    // Service-level Defense in Depth checks:
    // Penolakan dispute oleh clinical_reviewer di level service
    await assert.rejects(
      async () => {
        await recordCaseAction(
          'CASE-PB-002',
          'dispute',
          { title: 'Direct service call', content: 'Testing' },
          { role: 'clinical_reviewer', username: 'dr.anindya' }
        );
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.equal(err.message, 'Peran Anda tidak berwenang melakukan tindakan ini.');
        return true;
      },
      'recordCaseAction harus menolak role clinical_reviewer dengan status 403'
    );

    // Penolakan evidence dengan allowRevision pada kasus final di level service
    await assert.rejects(
      async () => {
        await recordCaseAction(
          'CASE-PB-004',
          'evidence',
          { title: 'Direct evidence call', note: 'Direct call test', allowRevision: true },
          { role: 'staff_jkn', username: 'staff.ahmad' }
        );
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.equal(err.message, 'Kasus sudah diputuskan; bukti baru memerlukan peninjauan ulang terpisah.');
        return true;
      },
      'recordCaseAction evidence dengan allowRevision pada kasus final harus ditolak dengan status 409'
    );

    // Penolakan dispute dengan allowRevision: "false" (string truthy) pada level service
    await assert.rejects(
      async () => {
        await recordCaseAction(
          'CASE-PB-004',
          'dispute',
          { title: 'Direct dispute non-boolean', content: 'Testing', allowRevision: 'false' },
          { role: 'staff_jkn', username: 'staff.ahmad' }
        );
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.equal(err.message, 'Kasus sudah diputuskan; bukti baru memerlukan peninjauan ulang terpisah.');
        return true;
      },
      'recordCaseAction dispute dengan allowRevision: "false" pada kasus final harus ditolak dengan status 409'
    );

    // Eksekusi sah staff_jkn di level service
    const directStaffResult = await recordCaseAction(
      'CASE-PB-002',
      'dispute',
      { title: 'Direct service staff call', content: 'Valid staff dispute' },
      { role: 'staff_jkn', username: 'staff.ahmad' }
    );
    assert.equal(directStaffResult.kind, 'dispute');
    assert.equal(await getCaseStatus('CASE-PB-002'), 'RECONCILIATION');

  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
    await pool.end();

    // Clean up temporary database
    try {
      const cleanupAdmin = new pg.Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        database: 'postgres',
        password: process.env.DB_PASSWORD || undefined
      });
      await cleanupAdmin.connect();
      await cleanupAdmin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
      await cleanupAdmin.end();
    } catch (cleanupErr) {
      console.warn('Gagal menghapus database uji:', cleanupErr.message);
    }
  }
});
