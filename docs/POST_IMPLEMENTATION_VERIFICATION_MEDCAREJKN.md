# LAPORAN VERIFIKASI PASCA IMPLEMENTASI 3 FOKUS UTAMA MEDCAREJKN
## PHANTOM BILLING, UPCODING, DAN EVIDENCE REVIEW

**Tanggal Pemeriksaan**: 30 Oktober 2026  
**Metode Audit**: Read-Only Source Code Inspection, Database State Query, dan Test Execution Verification  
**Lingkungan**: Lokal (`D:\medcare`)  
**Status Keseluruhan**: **PASS** (100% Terverifikasi, Tidak Ada Deviasi Kode)

---

## 1. RINGKASAN HASIL VERIFIKASI

Pemeriksaan menyeluruh secara *read-only* telah dilakukan terhadap hasil implementasi penyederhanaan fitur MedCareJKN. Seluruh temuan menunjukkan bahwa aplikasi telah berhasil disederhanakan agar berfokus secara eksklusif pada 3 pilar fungsional tanpa merusak arsitektur dasar, tanpa mutasi database demo, dan tanpa melanggar batasan pengamanan SEC-01.

| Komponen Evaluasi | Status | Bukti File / Lokasi Kode | Ringkasan Hasil |
|---|:---:|---|---|
| **Fitur 1: Phantom Billing** | **PASS** | [`config/risk_rules.json`](file:///D:/medcare/config/risk_rules.json#L4-L21)<br>[`shared/riskEngine.js`](file:///D:/medcare/shared/riskEngine.js#L7-L15) | Digerakkan oleh Rule `PB-01` (Bobot 65, threshold `unsupportedQuantity > 0`). Guardrail `evidenceAvailable === false` memicu `NO_CONCLUSION` secara konsisten. |
| **Fitur 2: Upcoding** | **PASS** | [`config/risk_rules.json`](file:///D:/medcare/config/risk_rules.json#L22-L36)<br>[`backend/src/controllers/claimController.js`](file:///D:/medcare/backend/src/controllers/claimController.js#L115-L123) | Digerakkan oleh Rule `UC-01` (Bobot 35, threshold `tariffGap > 0`). Evaluasi berbasis komparasi numerik selisih tarif terhadap tarif acuan terverifikasi INA-CBG. |
| **Fitur 3: Evidence Review** | **PASS** | [`backend/src/decision-engine/evidenceReconciliation.js`](file:///D:/medcare/backend/src/decision-engine/evidenceReconciliation.js#L11-L86)<br>[`shared/caseContract.js`](file:///D:/medcare/shared/caseContract.js#L4-L12) | Beroperasi berbasis mesin rekonsiliasi deterministik. Menghasilkan status `SUPPORTED`, `PARTIAL`, `UNSUPPORTED`, `UNAVAILABLE`, serta `evidenceGap` dan `coveragePct`. Bukan rule buatan penambah skor. |
| **API Allowlist Baru** | **PASS** | [`backend/src/controllers/claimController.js`](file:///D:/medcare/backend/src/controllers/claimController.js#L89-L144) | Endpoint `POST /api/claims/audit-check` membatasi masukan dan sinyal hanya pada 3 fokus target. Request dengan `riskMode` non-target ditolak HTTP 400. |
| **Integritas Risk Score** | **PASS** | [`backend/src/controllers/claimController.js`](file:///D:/medcare/backend/src/controllers/claimController.js#L128-L143) | Sinyal disaring melalui allowlist ketat sebelum `riskScore`, `riskLevel`, `reviewPriority`, dan `primaryRiskMode` dihitung ulang. Tidak ada kebocoran skor dari rule non-target. |
| **Endpoint Non-Target** | **PASS** | [`backend/src/routes/`](file:///D:/medcare/backend/src/routes/)<br>[`backend/src/app.js`](file:///D:/medcare/backend/src/app.js#L35-L43) | Seluruh endpoint non-target telah diklasifikasikan dengan benar (tersembunyi dari navigasi dan antrean aktif, namun terpelihara secara reversibel untuk kompatibilitas test PRD). |
| **Antrean Kasus Operasional** | **PASS** | [`backend/src/services/caseService.js`](file:///D:/medcare/backend/src/services/caseService.js#L40-L54)<br>[`frontend/src/pages/CasesPage.jsx`](file:///D:/medcare/frontend/src/pages/CasesPage.jsx#L34-L35) | Default antrean (`riskMode = 'FOCUS'`) menyajikan tepat 23 kasus klaim individual. 12 kasus pola agregat BPJS (`PATTERN_REVIEW`) dikecualikan dari antrean harian. |
| **Keamanan SEC-01** | **PASS** | [`backend/src/routes/caseRoutes.js`](file:///D:/medcare/backend/src/routes/caseRoutes.js#L17-L19)<br>[`backend/src/services/caseService.js`](file:///D:/medcare/backend/src/services/caseService.js#L380-L382) | Otorisasi role `staff_jkn` aktif pada route dan service. Validasi boolean ketat `payload.allowRevision === true` menolak string `"true"` dan int `1` dengan HTTP 409 pada kasus final. |
| **Integritas Database Demo** | **PASS** | Database PostgreSQL `jkn_integrity` | Tepat 37 baris kasus, 49 klaim, dan 108 evidence links tersimpan utuh tanpa ada penghapusan baris maupun mutasi status. |
| **File Sementara** | **PASS** | Folder Scratch Antigravity | Seluruh file otomasi tersimpan di folder scratch Antigravity, bersih dari direktori proyek `D:\medcare`. |

---

## 2. STATUS TIGA FITUR UTAMA

### A. PHANTOM BILLING (Rule PB-01) — PASS
- **Implementasi**:
  - Konfigurasi: [`config/risk_rules.json`](file:///D:/medcare/config/risk_rules.json) baris 4–21.
  - Perhitungan: [`shared/riskEngine.js`](file:///D:/medcare/shared/riskEngine.js) baris 7:
    `f.unsupportedQuantity = f.evidenceAvailable === true && available(f.claimedQty) && available(f.supportedQty) ? Math.max(0, Number(f.claimedQty) - Number(f.supportedQty)) : null;`
- **Karakteristik**:
  - Bobot: **65**.
  - Ambang batas: `unsupportedQuantity > 0`.
  - Required Fields: `evidenceAvailable`, `claimedQty`, `supportedQty`.
  - Prioritas Review: Memicu prioritas `HIGH` (skor $\ge 60$).
- **Safety Guardrail**:
  Apabila `evidenceAvailable === false` atau tidak tersedia, `unsupportedQuantity` bernilai `null` dan sinyal `PB-01` **tidak terpicu**. Sistem memicu sinyal fallback `EVIDENCE-MISSING`, menetapkan `riskScore: 0`, `primaryRiskMode: 'UNAVAILABLE'`, dan `reviewPriority: 'NO_CONCLUSION'`. Ketiadaan berkas fisik tidak pernah divonis otomatis sebagai fraud.

### B. UPCODING (Rule UC-01) — PASS
- **Implementasi**:
  - Konfigurasi: [`config/risk_rules.json`](file:///D:/medcare/config/risk_rules.json) baris 22–36.
  - Perhitungan: [`backend/src/controllers/claimController.js`](file:///D:/medcare/backend/src/controllers/claimController.js) baris 115–123:
    `scopedInput.tariffGap = Math.max(0, amount - ref);`
- **Karakteristik**:
  - Bobot: **35**.
  - Ambang batas: `tariffGap > 0`.
  - Required Fields: `tariffGap`.
  - Prioritas Review: Memicu prioritas `MEDIUM` (skor 35).
- **Integritas Penilaian**:
  Rule `UC-01` murni membandingkan selisih nominal tagihan dengan tarif acuan standar INA-CBG. Sistem **tidak mengklaim** validasi NLP tingkat keparahan (*severity level*) secara otomatis, melainkan menyajikan perbandingan disparitas tarif secara deterministik.

### C. EVIDENCE REVIEW — PASS
- **Implementasi**:
  - Mesin Rekonsiliasi: [`backend/src/decision-engine/evidenceReconciliation.js`](file:///D:/medcare/backend/src/decision-engine/evidenceReconciliation.js) baris 11–86 dan [`shared/caseContract.js`](file:///D:/medcare/shared/caseContract.js) baris 4–12.
- **Karakteristik**:
  - Status Rekonsiliasi per Butir:
    - `SUPPORTED`: Kuantitas didukung $\ge$ kuantitas klaim.
    - `PARTIAL`: Kuantitas didukung $> 0$ namun $<$ kuantitas klaim.
    - `UNSUPPORTED`: Kuantitas didukung $= 0$.
    - `UNAVAILABLE`: Berkas fisik belum tersedia di arsip rekam medis.
  - Formula Metrik:
    $$\text{evidenceGap} = \max(0, \text{claimedQuantity} - \text{supportedQuantity})$$
    $$\text{coveragePct} = \min\left(100, \text{round}\left(\frac{\text{supportedQuantity}}{\text{claimedQuantity}} \times 100\right)\right)$$
- **Penetapan Mode Risiko**:
  Sistem **tidak menciptakan Rule tiruan `ER-01`** atau memodifikasi `config/risk_rules.json`. Evidence Review hadir sebagai pilar rekonsiliasi yang menghitung disparitas bukti klinis.

---

## 3. HASIL VERIFIKASI API ALLOWLIST

### A. Gating Mode Risiko Baru pada `POST /api/claims/audit-check`
Pada [`backend/src/controllers/claimController.js`](file:///D:/medcare/backend/src/controllers/claimController.js) baris 91–93:
```javascript
if(input.riskMode && !['ALL','PHANTOM_BILLING','UPCODING','EVIDENCE_REVIEW'].includes(input.riskMode)){
  return res.status(400).json({message:'Mode risiko dinonaktifkan sementara. Fitur aktif: PHANTOM_BILLING, UPCODING, EVIDENCE_REVIEW.'});
}
```
Setiap permintaan audit baru dengan mode non-target (`UNNECESSARY_PROCEDURES`, `DUPLICATE_CLAIM`, `WRONG_DIAGNOSIS`, `GHOST_ENROLLEE`, `PATTERN_REVIEW`) langsung ditolak dengan HTTP 400.

### B. Sanitasi Parameter Masukan (`scopedInput`)
Pada baris 101–113, objek `scopedInput` diisolasi hanya untuk menerima:
`amountBilled`, `claimedQty`, `supportedQty`, `evidenceAvailable`, `dateEncounter`, `diagnosis`, `patientId`, `age`, `gender`, `providerId`, `saveCase`, dan `tariffGap`.  
Parameter non-target seperti `procedureIndication`, `duplicateCount`, `diagnosisProcedureMatch`, dan `enrollmentValid` **dibuang** sebelum pemanggilan `analyzeClaim(scopedInput)`.

### C. Analisis Alur Eksekusi Parameter `riskMode: 'ALL'`
1. **Arti `'ALL'` pada Endpoint Audit Baru (`claimController.js`)**:
   Nilai `'ALL'` menandakan bahwa analisis terbuka untuk mengevaluasi seluruh domain yang aktif pada allowlist (Phantom Billing dan Upcoding, serta status rekonsiliasi bukti).
2. **Apakah `'ALL'` hanya menjalankan 3 fokus utama?**
   **YA**. Karena parameter masukan non-target telah dibuang dari `scopedInput`, aturan `UP-01`, `DC-01`, `WD-01`, dan `GE-01` di `riskEngine.js` otomatis tidak terpenuhi syarat field-nya (`rule.requiredFields.every(key => available(f[key]))`).
3. **Apakah ada kemungkinan rule non-target tetap dievaluasi?**
   **TIDAK MUNGKIN**. Selain syarat field yang tidak ada, baris 128–129 secara eksplisit memfilter sinyal:
   ```javascript
   const ALLOWED_SIGNALS=['PB-01','UC-01','EVIDENCE-COMPLETE','EVIDENCE-MISSING'];
   analysis.signals=analysis.signals.filter(s=>ALLOWED_SIGNALS.includes(s.id));
   ```
   Sehingga aturan non-target sama sekali tidak dapat lolos ke hasil akhir.

---

## 4. HASIL VERIFIKASI INTEGRITAS RISK SCORE

Urutan eksekusi pada [`backend/src/controllers/claimController.js`](file:///D:/medcare/backend/src/controllers/claimController.js) baris 125–143 telah ditelusuri secara mendalam:

```
[1] Evaluasi Awal: analyzeClaim(scopedInput)
        ↓
[2] Penyaringan Sinyal dengan Allowlist:
    analysis.signals = analysis.signals.filter(s => ALLOWED_SIGNALS.includes(s.id))
        ↓
[3] Penghitungan Ulang Total Bobot:
    rawSum = analysis.signals.reduce((acc, s) => acc + (s.rawWeight || 0), 0)
    analysis.riskScore = Math.min(100, rawSum)
        ↓
[4] Normalisasi Kontribusi Sinyal:
    signal.contribution = rawSum > 100 ? (signal.rawWeight * 100) / rawSum : signal.rawWeight
        ↓
[5] Penentuan Ulang Risk Level & Review Priority:
    analysis.riskLevel = analysis.riskScore >= 60 ? 'HIGH' : analysis.riskScore >= 30 ? 'MEDIUM' : ...
    analysis.reviewPriority = analysis.riskScore >= 60 ? 'HIGH' : analysis.riskScore >= 30 ? 'MEDIUM' : ...
        ↓
[6] Penentuan Ulang Primary Risk Mode:
    analysis.primaryRiskMode = mainSignal?.fraudType || (analysis.evidenceGap > 0 ? 'EVIDENCE_REVIEW' : ...)
```

- **Integritas Perhitungan**:
  Penghitungan `riskScore` dilakukan **setelah** penyaringan `analysis.signals` dengan allowlist. Hal ini menjamin skor dan prioritas bersih 100% dan tidak dipengaruhi oleh bobot aturan non-target.

---

## 5. HASIL PEMERIKSAAN ENDPOINT NON-TARGET

Seluruh route pada [`backend/src/app.js`](file:///D:/medcare/backend/src/app.js) dan direktori `backend/src/routes/` telah diperiksa dan diklasifikasikan ke dalam 4 kategori resmi:

### Kategori 1: Benar-benar Dinonaktifkan di Backend
- **Endpoint**: `POST /api/claims/audit-check` dengan mode non-target (`riskMode: 'UNNECESSARY_PROCEDURES'`, `'DUPLICATE_CLAIM'`, `'WRONG_DIAGNOSIS'`, `'GHOST_ENROLLEE'`, `'PATTERN_REVIEW'`).
- **Mekanisme**: Ditolak langsung dengan respons HTTP 400 Bad Request.

### Kategori 2: Masih Aktif di Backend, tetapi Tersembunyi dari Frontend (Reversibel)
- **Modul Katalog Data BPJS 2025**:
  - `GET /api/bpjs/catalog`
  - `GET /api/bpjs/tables/:id`
  - `GET /api/bpjs/download/:type`
- **Modul Deteksi Anomali Tren Bulanan**:
  - `GET /api/bpjs/anomalies`
  - `POST /api/bpjs/anomalies/cases`
- **Modul Simulasi Audit Pasien SQLite**:
  - `GET /api/bpjs/patient-catalog`
  - `GET /api/bpjs/patients`
  - `GET /api/bpjs/patients/:cohort/:id`
  - `GET /api/bpjs/encounters/:id`
  - `GET /api/bpjs/audits`
  - `POST /api/bpjs/audits`
  - `GET /api/bpjs/audits/:id`
  - `PATCH /api/bpjs/audits/:id`
- **Modul Benchmark & Validasi AI**:
  - `GET /api/validation`
- **Batch Processing**:
  - `POST /api/analysis/run`
- *Catatan*: Endpoint ini dipertahankan di backend agar tidak mematahkan test suite bawaan (`bpjs.test.js`, `bpjsPatients.test.js`, `innovation.test.js`), namun seluruh navigasi, kartu, dan link antarmukanya telah dilepas dari frontend.

### Kategori 3: Masih Aktif dan Dapat Diakses Melalui Antarmuka (3 Fokus & Workflow Pendukung)
- `GET /api/cases` (Antrean Kasus Klaim dengan Filter Fokus)
- `GET /api/cases/:caseId` (Detail Kasus & Analisis Risiko)
- `GET /api/cases/:caseId/evidence` (Rantai Rekonsiliasi Bukti)
- `POST /api/cases/:caseId/files` (Unggah Berkas Fisik Bukti / Lampiran)
- `GET /api/cases/:caseId/files/:fileId` (Unduh Berkas Kasus)
- `POST /api/cases/:caseId/outcome` (Penetapan Hasil Telaah Dokter)
- `POST /api/cases/:caseId/assign` (Disposisi Dokter oleh Staff JKN)
- `POST /api/cases/:caseId/dispute` (Registrasi Sanggahan Faskes — Staff JKN only)
- `POST /api/cases/:caseId/evidence` (Penautan Dokumen Bukti Tambahan)
- `POST /api/claims/audit-check` (Uji Klaim Manual 3 Fokus)

### Kategori 4: Infrastruktur Bersama yang Memang Harus Dipertahankan
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session` (Autentikasi & Sesi)
- `GET /api/dashboard` (Ringkasan KPI Dashboard yang Disesuaikan)
- `GET /api/notifications`, `POST /api/notifications/mark-read` (Notifikasi Kasus)
- `GET /api/health` (Healthcheck Layanan)

---

## 6. HASIL VERIFIKASI EVIDENCE REVIEW & IRISAN FILTER

Pemeriksaan kueri database demo `jkn_integrity` menghasilkan data aktual berikut:

| Filter Kueri | Formula Filter SQL | Jumlah Kasus Unik | Kasus yang Ditemukan |
|---|---|:---:|---|
| **Phantom Billing** | `c.primary_risk_mode = 'PHANTOM_BILLING'` | **14** | `CASE-0025` s/d `0032`, `CASE-37953afefd07454e89f6`, `CASE-PB-001`, `002`, `005`, `007`, `008` |
| **Upcoding** | `c.primary_risk_mode = 'UPCODING'` | **1** | `CASE-PB-003` |
| **Evidence Review** | `c.primary_risk_mode = 'EVIDENCE_REVIEW' OR (c.evidence_gap IS NOT NULL AND c.evidence_gap > 0)` | **8** | `CASE-0017` s/d `CASE-0024` (seluruhnya memiliki gap bukti = 3.00) |
| **Semua Fokus (FOCUS)** | `(c.primary_risk_mode IN ('PHANTOM_BILLING', 'UPCODING', 'EVIDENCE_REVIEW') OR (c.evidence_gap IS NOT NULL AND c.evidence_gap > 0)) AND (c.case_type IS NULL OR c.case_type != 'pattern')` | **23** | 14 Phantom Billing + 1 Upcoding + 8 Evidence Review = **23 kasus unik** |

### Analisis Kategori yang Saling Beririsan (Non-Eksklusif):
1. **Pada Dataset Demo Seed**:
   Kasus historis seed terbagi ke dalam kategori primer masing-masing sehingga irisan antara PB, UC, dan ER pada dataset seed adalah himpunan kosong ($14 + 1 + 8 = 23$).
2. **Pada Model Data Operasional**:
   Kueri filter Evidence Review:
   `primary_risk_mode = 'EVIDENCE_REVIEW' OR (evidence_gap IS NOT NULL AND evidence_gap > 0)`
   secara sengaja **tidak bersifat mutual exclusive**. Apabila terdapat klaim baru yang memiliki indikasi `PHANTOM_BILLING` sekaligus memiliki `evidence_gap > 0` (misalnya tagihan 10 unit, bukti pendukung 2 unit, gap = 8 unit), kasus tersebut **akan muncul pada filter Phantom Billing dan juga akan muncul pada filter Evidence Review**. Hal ini menjamin auditor dapat meninjau kasus dari kedua sudut pandang tanpa adanya distorsi klasifikasi paksa.

---

## 7. HASIL PEMERIKSAAN ANTREAN DAN AKSES HISTORIS

1. **Default Antrean Kasus**:
   Pada [`frontend/src/pages/CasesPage.jsx`](file:///D:/medcare/frontend/src/pages/CasesPage.jsx) baris 34, filter default ditetapkan ke `riskMode: 'FOCUS'` ("Semua Fokus Utama"), yang memuat tepat 23 kasus klaim individual aktif.
2. **Pengecualian Kasus Agregat `PATTERN_REVIEW`**:
   Pada [`backend/src/services/caseService.js`](file:///D:/medcare/backend/src/services/caseService.js) baris 52:
   `baseWhere += " AND (c.primary_risk_mode IS NULL OR c.primary_risk_mode != 'PATTERN_REVIEW') AND (c.case_type IS NULL OR c.case_type != 'pattern')"`.
   Sebanyak 12 kasus pola agregat BPJS (`CASE-0009`..`0016`, `CASE-0037`..`0040`) secara efektif disembunyikan dari antrean harian auditor klaim individual.
3. **Pilihan Akses Historis (`ALL_HISTORICAL`)**:
   - Opsi `riskMode: 'ALL_HISTORICAL'` tersedia secara reversibel untuk membaca seluruh 37 baris kasus di database.
   - Kueri `getAllCases` murni operasi `SELECT` (read-only) dan tidak memiliki alur mutasi data apa pun.
   - **Isolasi Keamanan**: Pada [`backend/src/controllers/caseController.js`](file:///D:/medcare/backend/src/controllers/caseController.js) baris 6, bila pengguna adalah `clinical_reviewer`, sistem selalu memaksakan `assignedTo: req.user.username`. Oleh karena itu, dokter reviewer tetap **tidak dapat** mengakses kasus milik dokter lain meskipun menggunakan opsi `ALL_HISTORICAL`.

---

## 8. HASIL PEMERIKSAAN KEAMANAN SEC-01

Pengamanan otorisasi pada endpoint sanggahan/dispute terverifikasi 100% utuh:

1. **Route Guard**:
   Pada [`backend/src/routes/caseRoutes.js`](file:///D:/medcare/backend/src/routes/caseRoutes.js) baris 18:
   `const guard=['ownership','clarification','schedule','dispute'].includes(action)?requireRole('staff_jkn'):...`
   Endpoint `POST /api/cases/:caseId/dispute` mewajibkan token dengan role `staff_jkn`.
2. **Service Authorization**:
   Pada [`backend/src/services/caseService.js`](file:///D:/medcare/backend/src/services/caseService.js) baris 380:
   `if(kind==='dispute'&&actor?.role!=='staff_jkn'){const e=new Error('Peran Anda tidak berwenang melakukan tindakan ini.');e.statusCode=403;throw e;}`
3. **Validasi Boolean Ketat `allowRevision === true`**:
   Pada baris 381:
   `const isAllowedDisputeRevision = kind === 'dispute' && actor?.role === 'staff_jkn' && payload?.allowRevision === true;`
   - Nilai string `"true"` menghasilkan perbandingan `=== true` bernilai `false`.
   - Nilai integer `1` menghasilkan perbandingan `=== true` bernilai `false`.
   - Kedua kasus tersebut ditolak dengan HTTP 409 Conflict pada kasus final.
4. **Perlindungan Kasus Final**:
   Pada baris 382:
   `if(['CONFIRMED','NOT_CONFIRMED','CLOSED'].includes(row.case_status)&&!['feedback','copilot'].includes(kind)&&!isAllowedDisputeRevision){const e=new Error('Kasus sudah diputuskan; bukti baru memerlukan peninjauan ulang terpisah.');e.statusCode=409;throw e;}`
   Kasus berstatus final tidak dapat diubah oleh action non-dispute (`ownership`, `clarification`, `schedule`, `evidence`).
5. **Verifikasi Pengujian**:
   Test suite [`backend/tests/security.dispute.test.js`](file:///D:/medcare/backend/tests/security.dispute.test.js) (10 skenario otorisasi dan status hardening) **LULUS 100%**.

---

## 9. DAFTAR FILE SEMENTARA

Pemeriksaan terhadap direktori source code proyek `D:\medcare` memastikan bahwa **tidak ada file sementara atau script `.mjs` yang tertinggal** di dalam folder source code aplikasi (`D:\medcare`, `backend/`, `frontend/`, `shared/`, `docs/`).

Seluruh script otomasi dan verifikasi yang digunakan pada sesi sebelumnya tersimpan secara terisolasi di dalam direktori artefak scratch Antigravity OS:
`C:\Users\user\.gemini\antigravity\brain\d7e9b52a-8e85-4e00-8fbd-522866c6a6f6\scratch\`

| Nama File | Lokasi Fisik | Fungsi Script |
|---|---|---|
| `update_header.mjs` | `<scratch>/update_header.mjs` | Otomasi pembaruan array navigasi 4 menu pada `MedcareHeader.jsx`. |
| `update_app.mjs` | `<scratch>/update_app.mjs` | Otomasi pengalihan routing view `input` ke `ClaimAuditInputPage.jsx` pada `App.jsx`. |
| `update_cases_page.mjs` | `<scratch>/update_cases_page.mjs` | Otomasi pembatasan dropdown mode risiko dan kode alasan pada `CasesPage.jsx`. |
| `verify_3_focus.mjs` | `<scratch>/verify_3_focus.mjs` | Script pengujian mandiri untuk skenario PB-01, UC-01, guardrail unavailable, dan kueri database. |
| `verify_case_counts.mjs` | `<scratch>/verify_case_counts.mjs` | Script read-only query untuk menghitung irisan kasus unik PB, UC, dan ER pada database demo. |
| `generate_env.js` | `<scratch>/generate_env.js` | Helper konfigurasi variabel lingkungan pengujian terisolasi. |

---

## 10. TEMUAN ATAU RISIKO YANG MASIH TERSISA

1. **[WARNING] Evaluasi Upcoding Berbasis Disparitas Numerik Tarif**:
   - *Temuan*: Rule `UC-01` murni mengevaluasi perbandingan angka tarif tagihan klaim terhadap tarif acuan standar INA-CBG (`tariffGap = amountBilled - referenceTariff > 0`). Rule ini tidak membaca resume medis atau melakukan NLP klasifikasi keparahan klinis (*severity level* I, II, III).
   - *Status*: **Dikelola dengan Benar**. Label dan deskripsi antarmuka pada `ClaimAuditInputPage` dan `CasesPage` telah disesuaikan agar tidak membuat klaim validasi keparahan klinis otomatis.
2. **[WARNING] Ketersediaan Kasus Upcoding Historis Seed**:
   - *Temuan*: Pada database demo `jkn_integrity`, hanya terdapat 1 kasus historis seed dengan label `UPCODING` (`CASE-PB-003`).
   - *Status*: **Dikelola dengan Benar**. Halaman Uji Klaim Manual telah menyediakan preset skenario Upcoding terstruktur sehingga auditor dapat melakukan simulasi dan mencatatkan klaim uji Upcoding kapan pun dibutuhkan.
3. **[WARNING] Endpoint Non-Target Masih Terdaftar di Express App**:
   - *Temuan*: Endpoint `/api/bpjs/*` dan `/api/validation/*` tetap aktif di server Express backend dan belum di-unmount total.
   - *Status*: **Desain yang Disengaja (Reversibel)**. Hal ini diperlukan agar test suite integritas backend bawaan (`bpjs.test.js`, `stability.integration.test.js`) tetap dapat berjalan lulus 24/24 tanpa melanggar batasan penghapusan kode. Dari sisi pengguna umum, tidak ada antarmuka yang mengarah ke endpoint-endpoint tersebut.

---

## 11. KESIMPULAN AKHIR

Berdasarkan seluruh hasil penelusuran kode sumber, skema database, alur eksekusi API, integritas kalkulasi skor, dan riwayat pengujian regresi:

> **STATUS AKHIR: PASS (TERVERIFIKASI PENUH)**  
> Implementasi penyederhanaan fitur MedCareJKN menjadi **Tiga Fokus Utama (Phantom Billing, Upcoding, dan Evidence Review)** telah terverifikasi beroperasi dengan tepat, konsisten, aman, dan mematuhi seluruh batasan mutlak proyek.

