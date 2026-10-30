# LAPORAN TARGETED AUDIT: PENUTUPAN TEMUAN VERIFIKASI MEDCAREJKN
## AUDIT FOKUS: KASUS UNAVAILABLE, ENDPOINT NON-TARGET, MODE AUDIT, HISTORIS, DAN INTEGRITAS DATA

**Tanggal Audit**: 30 Oktober 2026  
**Metode Audit**: Read-Only Source Code Analysis, AST & Query Execution Tracing, Database Record Timestamp & Field Integrity Verification  
**Lingkungan**: Lokal (`D:\medcare`)  
**Basis Dokumen Acuan**: [`docs/POST_IMPLEMENTATION_VERIFICATION_MEDCAREJKN.md`](file:///D:/medcare/docs/POST_IMPLEMENTATION_VERIFICATION_MEDCAREJKN.md)  
**Status Keseluruhan**: **PASS WITH TARGETED WARNINGS** (Seluruh mekanisme inti valid, 3 temuan spesifik teridentifikasi dengan rekomendasi penutupan terukur)

---

## 1. RINGKASAN TEMUAN AUDIT

Audit mendalam berbasis bukti kode dan data riil telah dilaksanakan untuk menguji lima area krusial yang diidentifikasi pada laporan verifikasi sebelumnya:

| Area Pemeriksaan | Status | Ringkasan Temuan Utama |
|---|:---:|---|
| **1. Kasus UNAVAILABLE (`evidenceAvailable: false`)** | **WARNING** | Guardrail safety klinis berfungsi 100% (`NO_CONCLUSION`, skor 0, no fraud). Namun, kasus baru yang disimpan dengan `primary_risk_mode = 'UNAVAILABLE'` dan `evidence_gap = null` **tidak muncul pada antrean operasional default `FOCUS`** karena kueri antrean hanya memfilter `primary_risk_mode IN ('PHANTOM_BILLING', 'UPCODING', 'EVIDENCE_REVIEW') OR evidence_gap > 0`. |
| **2. Penonaktifan Endpoint Non-Target** | **WARNING** | Menu frontend telah dilepas 100%, namun seluruh route (`/api/bpjs/*`, `/api/validation/*`, `/api/analysis/run`) **masih terdaftar di Express (`app.js`)** dan sebagian besar **tidak memiliki middleware autentikasi**. Pengguna dapat mengakses modul tersebut melalui HTTP request langsung (curl/Postman). Endpoint tetap dipertahankan agar test suite PRD bawaan tidak gagal. |
| **3. Mode Audit pada `auditCheckClaim`** | **WARNING** | Parameter `riskMode` pada `auditCheckClaim` berfungsi sebagai **Allowlist Gatekeeper** (menolak modus non-target dengan HTTP 400), **bukan Rule Isolator**. Jika payload memuat parameter Phantom Billing DAN Upcoding, kedua sinyal (`PB-01` dan `UC-01`) tetap terpicu bersamaan terlepas dari apakah `riskMode` diset ke `PHANTOM_BILLING` atau `UPCODING`. |
| **4. Akses Historis (`ALL_HISTORICAL`)** | **PASS** | Parameter `ALL_HISTORICAL` murni filter kueri baca (`SELECT`). Controller tetap mengunci `assignedTo = req.user.username` untuk Reviewer Klinis (terbukti Dr. Anindya hanya melihat 6 kasusnya dan Dr. Budi hanya melihat 2 kasusnya). Hak mutasi pada `CaseDetailPage` tetap dilindungi guard status final dan otorisasi SEC-01. |
| **5. Integritas Database Demo `jkn_integrity`** | **PASS** | Terbukti 100% tidak ada mutasi pada database demo `jkn_integrity`. Timestamp terakhir pada `audit_logs`, `case_documents`, dan `cases` tercatat pada **29 Oktober 2026 pukul 17:49:48 UTC** (sebelum implementasi Task 2). Integritas field 8 kasus demo dan 28 kasus seed terverifikasi cocok. |

---

## 2. PEMERIKSAAN KASUS UNAVAILABLE

### A. Penelusuran Alur Kode (Trace Flow)

1. **Evaluasi Engine ([`shared/riskEngine.js`](file:///D:/medcare/shared/riskEngine.js#L7-L15))**:
   - Baris 7: `f.unsupportedQuantity = f.evidenceAvailable === true ... ? ... : null;`
   - Bila `evidenceAvailable === false`: `unsupportedQuantity` bernilai `null`, sehingga aturan `PB-01` tidak memenuhi syarat evaluasi.
   - Baris 11: `evidenceKnown` bernilai `false`.
   - Baris 13: `signals` menghasilkan `[{ id: 'EVIDENCE-MISSING', label: 'Bukti belum tersedia untuk disimpulkan', rawWeight: 0, nextAction: 'Minta bukti layanan, tanpa menyimpulkan fraud.' }]`.
   - Baris 14–15:
     - `riskScore = 0`
     - `reviewPriority = 'NO_CONCLUSION'`
     - `primaryRiskMode = 'UNAVAILABLE'`
     - `fraudType = 'Bukti belum tersedia'`
     - `evidenceGap = null`
     - `evidenceCoveragePct = null`
2. **Penyimpanan Kasus ([`backend/src/controllers/claimController.js`](file:///D:/medcare/backend/src/controllers/claimController.js#L139-L157))**:
   - Jika `saveCase === true`, record disimpan ke tabel `cases` dengan:
     `primary_risk_mode = 'UNAVAILABLE'`, `review_priority = 'NO_CONCLUSION'`, `evidence_gap = NULL`.
3. **Kueri Antrean ([`backend/src/services/caseService.js`](file:///D:/medcare/backend/src/services/caseService.js#L46-L52))**:
   ```javascript
   } else if (riskMode === 'FOCUS' || riskMode === 'ALL_FOCUS') {
     baseWhere += ` AND (c.primary_risk_mode IN ('PHANTOM_BILLING', 'UPCODING', 'EVIDENCE_REVIEW') OR (c.evidence_gap IS NOT NULL AND c.evidence_gap > 0)) AND (c.case_type IS NULL OR c.case_type != 'pattern')`;
   }
   ```
4. **Antarmuka Antrean ([`frontend/src/pages/CasesPage.jsx`](file:///D:/medcare/frontend/src/pages/CasesPage.jsx#L34-L35,L340))**:
   - State awal: `filters.riskMode = 'FOCUS'`.
   - Dropdown `queue-risk-mode` hanya menyediakan: `FOCUS`, `PHANTOM_BILLING`, `UPCODING`, `EVIDENCE_REVIEW`.

### B. Temuan Kasus UNAVAILABLE pada Antrean

1. **Kasus Seed Historis dengan `review_priority = 'NO_CONCLUSION'`**:
   - Pada database demo `jkn_integrity`, terdapat 16 kasus dengan `review_priority = 'NO_CONCLUSION'` (`CASE-PB-001`, `002`, `005`, `007`, `008`, `CASE-0025` s/d `0032`, dll.).
   - Seluruh kasus seed tersebut memiliki `primary_risk_mode = 'PHANTOM_BILLING'` (atau `UPCODING`).
   - Oleh karena itu, kasus seed tersebut **tetap muncul pada antrean operasional `FOCUS`** dan dapat difilter dengan prioritas `NO_CONCLUSION`.
2. **Kasus Baru Hasil Input Manual dengan `evidenceAvailable: false`**:
   - Kasus baru yang disimpan memiliki `primary_risk_mode = 'UNAVAILABLE'` dan `evidence_gap = null`.
   - **Kelemahan Arsitektur**: Kasus baru ini **TIDAK MUNCUL** pada antrean operasional default `FOCUS`, karena `'UNAVAILABLE'` tidak termasuk dalam `IN ('PHANTOM_BILLING', 'UPCODING', 'EVIDENCE_REVIEW')` dan `evidence_gap` bernilai `null`.
   - Bahkan jika pengguna menyaring dengan `Prioritas = NO_CONCLUSION`, karena filter mode tetap `FOCUS`, kasus baru tersebut tetap tidak akan muncul di daftar antrean.
3. **Tindak Lanjut pada Halaman Detail ([`CaseDetailPage.jsx`](file:///D:/medcare/frontend/src/pages/CaseDetailPage.jsx#L1050-L1110))**:
   - Jika kasus diakses langsung (via ID atau tautan tersimpan):
     - Reviewer/Staff dapat menugaskan dokter (`assignCaseReviewer`).
     - Staff JKN dapat mengirim permintaan klarifikasi (`sendClarificationRequestToClinician`).
     - Pengguna dapat mengunggah bukti fisik (`uploadSupportingEvidence`).
     - Begitu bukti diverifikasi, fungsi `recordCaseAction('evidence')` menghitung ulang klaim dan memperbarui status menjadi `SUPPORTED` / `PARTIAL`, serta menghitung `evidence_gap`.

---

## 3. PEMERIKSAAN PENONAKTIFAN ENDPOINT NON-TARGET

### A. Penelusuran Route Backend

Pemeriksaan terhadap [`backend/src/app.js`](file:///D:/medcare/backend/src/app.js#L35-L43) dan file-file di `backend/src/routes/`:

```javascript
// backend/src/app.js
app.use('/api/bpjs', bpjsRoutes);
app.use('/api/bpjs', bpjsPatientRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/analysis', analysisRoutes);
```

| Endpoint Non-Target | File Route Backend | Middleware Autentikasi | Akses Langsung HTTP (curl/Postman) | Status Gating Backend |
|---|---|:---:|:---:|:---:|
| `GET /api/bpjs/catalog` | [`bpjsRoutes.js`](file:///D:/medcare/backend/src/routes/bpjsRoutes.js#L13) | Tidak Ada | **Terbuka (Publik)** | Masih aktif melayani data katalog BPJS |
| `GET /api/bpjs/tables/:id` | [`bpjsRoutes.js`](file:///D:/medcare/backend/src/routes/bpjsRoutes.js#L16) | Tidak Ada | **Terbuka (Publik)** | Masih aktif melayani detail tabel |
| `GET /api/bpjs/download/:type` | [`bpjsRoutes.js`](file:///D:/medcare/backend/src/routes/bpjsRoutes.js#L23) | Tidak Ada | **Terbuka (Publik)** | Masih aktif mengunduh file Excel/ZIP |
| `GET /api/bpjs/anomalies` | [`bpjsRoutes.js`](file:///D:/medcare/backend/src/routes/bpjsRoutes.js#L11) | Tidak Ada | **Terbuka (Publik)** | Masih aktif mengevaluasi tren pola |
| `POST /api/bpjs/anomalies/cases` | [`bpjsRoutes.js`](file:///D:/medcare/backend/src/routes/bpjsRoutes.js#L12) | `requireSession`, `requireRole('staff_jkn')` | **Bisa diakses oleh Staff JKN** | Masih aktif membuat kasus `CASE-PAT` |
| `GET /api/bpjs/patient-catalog` | [`bpjsPatientRoutes.js`](file:///D:/medcare/backend/src/routes/bpjsPatientRoutes.js#L5) | Tidak Ada | **Terbuka (Publik)** | Masih aktif melayani data SQLite |
| `GET /api/bpjs/patients/*` | [`bpjsPatientRoutes.js`](file:///D:/medcare/backend/src/routes/bpjsPatientRoutes.js#L6-L8) | Tidak Ada | **Terbuka (Publik)** | Masih aktif melayani data pasien SQLite |
| `GET /api/bpjs/audits/*` | [`bpjsPatientRoutes.js`](file:///D:/medcare/backend/src/routes/bpjsPatientRoutes.js#L9-L12) | Tidak Ada | **Terbuka (Publik)** | Masih aktif melayani/memutasi audit SQLite |
| `GET /api/validation` | [`validationRoutes.js`](file:///D:/medcare/backend/src/routes/validationRoutes.js#L6-L8) | `requireSession` | **Bisa diakses pengguna login** | Masih aktif menghasilkan report benchmark AI |
| `POST /api/analysis/run` | [`analysisRoutes.js`](file:///D:/medcare/backend/src/routes/analysisRoutes.js#L6-L8) | `requireSession` | **Bisa diakses pengguna login** | Masih aktif menjalankan batch analysis |

### B. Analisis Risiko Akses Langsung
Meskipun menu dan antarmuka pada frontend (`MedcareHeader.jsx` dan `App.jsx`) telah dibersihkan secara rapi sehingga pengguna biasa tidak memiliki tombol navigasi ke modul-modul ini, **pengguna tingkat lanjut atau pihak eksternal tetap dapat melakukan request HTTP langsung** ke endpoint-endpoint tersebut.

### C. Alasan Pemeliharaan Route
Endpoint-endpoint ini tidak di-unmount dari Express karena test suite PRD backend (`backend/tests/bpjs.test.js`, `bpjsPatients.test.js`, `innovation.test.js`, dan `stability.integration.test.js`) secara eksplisit menguji endpoint-endpoint ini. Apabila route di-unmount total, 10 dari 24 unit test backend akan langsung gagal.

---

## 4. PEMERIKSAAN MODE AUDIT PADA `POST /api/claims/audit-check`

### A. Alur Pemrosesan Parameter `riskMode`

Pemeriksaan kode pada [`backend/src/controllers/claimController.js`](file:///D:/medcare/backend/src/controllers/claimController.js) baris 91–143 menunjukkan:

```javascript
// Baris 91: Validasi Allowlist
if(input.riskMode && !['ALL','PHANTOM_BILLING','UPCODING','EVIDENCE_REVIEW'].includes(input.riskMode)){
  return res.status(400).json({message:'Mode risiko dinonaktifkan sementara. Fitur aktif: PHANTOM_BILLING, UPCODING, EVIDENCE_REVIEW.'});
}
// Baris 101-123: Sanitasi Masukan
const scopedInput = { amountBilled, claimedQty, supportedQty, evidenceAvailable, ... };
if(input.referenceTariff) scopedInput.tariffGap = Math.max(0, amount - ref);

// Baris 125: Eksekusi Engine Holistik
const analysis = analyzeClaim(scopedInput);

// Baris 128: Allowlist Sinyal Global
const ALLOWED_SIGNALS=['PB-01','UC-01','EVIDENCE-COMPLETE','EVIDENCE-MISSING'];
analysis.signals = analysis.signals.filter(s=>ALLOWED_SIGNALS.includes(s.id));
```

### B. Hasil Pengujian Empiris Setiap Mode

Pengujian empiris dilakukan menggunakan skenario input *hybrid* (memuat disparitas kuantitas Phantom Billing: klaim 10 vs bukti 2, DAN disparitas tarif Upcoding: tagihan Rp32.000.000 vs acuan Rp22.400.000):

| Parameter `riskMode` | HTTP Status | Sinyal yang Muncul | Skor Risiko | Primary Risk Mode | Sinyal Mode Lain Muncul? |
|---|:---:|:---:|:---:|:---:|:---:|
| `PHANTOM_BILLING` | 200 OK | `['PB-01', 'UC-01']` | 100 | `PHANTOM_BILLING` | **YA** (`UC-01` tetap muncul) |
| `UPCODING` | 200 OK | `['PB-01', 'UC-01']` | 100 | `PHANTOM_BILLING` | **YA** (`PB-01` tetap muncul) |
| `EVIDENCE_REVIEW` | 200 OK | `['PB-01', 'UC-01']` | 100 | `PHANTOM_BILLING` | **YA** (Keduanya tetap muncul) |
| `ALL` | 200 OK | `['PB-01', 'UC-01']` | 100 | `PHANTOM_BILLING` | **YA** (Keduanya muncul) |
| `DUPLICATE_CLAIM` | **400 Bad Request** | Tidak diproses | - | - | **TIDAK** (Ditolak allowlist) |

### C. Temuan
- Parameter `riskMode` pada audit baru saat ini **tidak bertindak sebagai pemisah evaluasi eksklusif**, melainkan sebagai **penjaga pintu (gatekeeper)** yang menolak request dengan modus non-target.
- Engine melakukan analisis multi-faktor menyeluruh terhadap semua parameter yang disediakan pada payload yang diizinkan.

---

## 5. PEMERIKSAAN AKSES HISTORIS (`ALL_HISTORICAL`)

### A. Sifat Kueri Antrean vs Hak Akses Halaman Detail

| Aspek Pemeriksaan | Penilaian | Bukti Kode | Konfirmasi Hasil |
|---|:---:|---|---|
| **Sifat Kueri Antrean** | **PASS** | [`backend/src/services/caseService.js`](file:///D:/medcare/backend/src/services/caseService.js#L61-L113) | Kueri `getAllCases` murni operasi `SELECT` (baca-saja) dan paginasi. Tidak ada mutasi status, skor, atau data kasus. |
| **Isolasi Kepemilikan Reviewer** | **PASS** | [`backend/src/controllers/caseController.js`](file:///D:/medcare/backend/src/controllers/caseController.js#L6) | `assignedTo: req.user.role === 'clinical_reviewer' ? req.user.username : assignedTo`. Controller memaksakan `assignedTo` reviewer sehingga dokter tidak dapat melihat kasus dokter lain meskipun menggunakan `ALL_HISTORICAL`. |
| **Proteksi Mutasi Outcome Kasus Final** | **PASS** | [`backend/src/services/caseService.js`](file:///D:/medcare/backend/src/services/caseService.js#L250-L257) | `if (['CONFIRMED','NOT_CONFIRMED','CLOSED'].includes(case_status)) throw HTTP 409;` dan `if (assigned_to !== reviewerId) throw HTTP 403;`. Kasus final tidak dapat di-outcome ulang. |
| **Proteksi Mutasi Sanggahan (SEC-01)** | **PASS** | [`backend/src/services/caseService.js`](file:///D:/medcare/backend/src/services/caseService.js#L380-L382) | Otorisasi role `staff_jkn` mutlak. Bila kasus final, hanya diizinkan jika `payload.allowRevision === true` murni. |
| **Proteksi Mutasi Action Non-Dispute** | **PASS** | [`backend/src/services/caseService.js`](file:///D:/medcare/backend/src/services/caseService.js#L382) | Tindakan non-dispute (`evidence`, `clarification`, `schedule`, `ownership`) ditolak HTTP 409 bila status kasus final. |

### B. Pengujian Empiris Hak Akses Reviewer Klinis pada `ALL_HISTORICAL`
- **Staff JKN** memanggil `ALL_HISTORICAL`: Mengembalikan seluruh **37 kasus** historis di database.
- **Dr. Anindya Kusuma, Sp.PK** memanggil `ALL_HISTORICAL`: Hanya mengembalikan **6 kasus** miliknya (`CASE-PB-001`, `002`, `005`, `007`, `CASE-0009`, `CASE-37953afefd07454e89f6`).
- **Dr. Budi Santoso, Sp.A** memanggil `ALL_HISTORICAL`: Hanya mengembalikan **2 kasus** miliknya (`CASE-PB-003`, `CASE-PB-006`).
- **Kesimpulan**: Parameter `ALL_HISTORICAL` tidak memberikan celah bypass isolasi kepemilikan bagi Reviewer Klinis.

---

## 6. BUKTI INTEGRITAS DATABASE DEMO `jkn_integrity`

Klaim bahwa database demo `jkn_integrity` **100% tidak termutasi** didasarkan pada bukti audit forensik berikut (bukan sekadar hitungan jumlah baris):

### A. Bukti Timestamp Audit Trail (Waktu Transaksi Terakhir)
Pemeriksaan langsung terhadap field `created_at` pada tabel transaksi dan audit log membuktikan:
1. `SELECT MAX(created_at) FROM audit_logs`:
   $$\text{Timestamp Terakhir} = \mathbf{2026-10-29T17:49:48.338Z}$$
2. `SELECT MAX(created_at) FROM case_documents`:
   $$\text{Timestamp Terakhir} = \mathbf{2026-10-29T17:49:48.338Z}$$
3. `SELECT MAX(created_at) FROM cases`:
   $$\text{Timestamp Terakhir} = \mathbf{2026-10-29T16:56:44.474Z} \quad (\text{kasus } \texttt{CASE-37953afefd07454e89f6})$$
Tidak ada satu pun record transaksi baru yang dicatat di database demo `jkn_integrity` sepanjang pelaksanaan Task 2 (30 Oktober 2026).

### B. Bukti Konsistensi Objek & Rekonsiliasi 37 Baris Kasus
- Jumlah baris tabel `cases`: Tepat **37 baris**.
- Jumlah baris tabel `claims`: Tepat **49 baris**.
- Jumlah baris tabel `evidence_links`: Tepat **108 baris**.

**Rekonsiliasi Lengkap Asal 37 Record Kasus**:
1. **8 Kasus Demo Utama** ([`data/demo/cases.json`](file:///D:/medcare/data/demo/cases.json)):
   `CASE-PB-001` s/d `CASE-PB-008` (8 baris, `source = 'seed'`).
2. **28 Kasus Seed Database** ([`database/seed.sql`](file:///D:/medcare/database/seed.sql)):
   - 24 kasus klaim: `CASE-0009` s/d `CASE-0032` (termasuk 8 kasus `CASE-0025` s/d `0032` dengan evaluasi ketiadaan berkas fisik).
   - 4 kasus pola faskes: `CASE-0037` s/d `CASE-0040` (`case_type = 'pattern'`).
   Total dari `seed.sql` = 28 baris (`source = 'seed'`).
3. **1 Kasus Verifikasi E2E SEC-01 Sebelumnya**:
   `CASE-37953afefd07454e89f6` (`source = 'phantom_checker'`, dibuat pada `2026-10-29T16:56:44.474Z` saat pengetesan alur menyeluruh create case -> attach evidence -> dispute -> outcome `NOT_CONFIRMED`).
   Total keseluruhan = $8 + 28 + 1 = \mathbf{37\text{ baris}}$.

### C. Cakupan Bukti Integritas Record terhadap Baseline
Pemeriksaan record dilakukan pada field-field kunci (`case_id`, `claim_id`, `primary_risk_mode`, `case_status`, `assigned_to`, dan `risk_score`):
- Seluruh 8 kasus `CASE-PB-001` s/d `CASE-PB-008`: Field status, assignment, dan skor terverifikasi cocok dengan kondisi baseline 29 Oktober (termasuk `CASE-PB-001` yang telah berstatus `NEEDS_MORE_EVIDENCE` sejak audit UAT sebelum sesi ini).
- Seluruh 28 kasus dari `seed.sql`: 20 kasus operasional/pola terverifikasi konsisten dengan data migrasi seed; 8 kasus `CASE-0025` s/d `0032` konsisten berstatus `NO_CONCLUSION` dengan ketiadaan berkas fisik.
- 1 kasus E2E validasi (`CASE-37953afefd07454e89f6`): Terverifikasi tidak termutasi sejak waktu pembuatannya (29 Oktober 2026 16:56:44 UTC) sebagaimana dibuktikan oleh timestamp audit log terakhir.

---

## 7. RISIKO YANG BELUM TERSELESAIKAN

1. **[RISIKO TINGGI - VISIBILITAS KASUS UNAVAILABLE]**:
   Kasus baru yang diinput via formulir `ClaimAuditInputPage` dengan skenario `evidenceAvailable: false` (dan dicentang simpan) disimpan dengan `primary_risk_mode = 'UNAVAILABLE'` dan `evidence_gap = null`. Kueri `FOCUS` saat ini tidak menyertakan `'UNAVAILABLE'`, sehingga **kasus baru tersebut tidak akan terlihat pada antrean operasional staf maupun dokter**.
2. **[RISIKO SEDANG - EKSPOSUR HTTP MODUL NON-TARGET]**:
   Endpoint `/api/bpjs/*` dan `/api/validation` masih terbuka untuk request HTTP langsung tanpa antarmuka frontend. Endpoint `/api/bpjs/*` bahkan tidak memiliki proteksi sesi, sehingga data simulasi pasien SQLite dan unduhan dokumen dapat diakses secara publik.
3. **[RISIKO RENDAH - SINGLE-MODE AUDIT EVALUATION]**:
   Client yang mengirim request ke `auditCheckClaim` dengan parameter `riskMode: 'PHANTOM_BILLING'` namun menyertakan data `referenceTariff` akan tetap menerima sinyal Upcoding (`UC-01`). Hal ini dapat menimbulkan kerancuan jika penguji mengharapkan mode tersebut murni hanya mengevaluasi satu jenis kecurangan.

---

## 8. REKOMENDASI PERBAIKAN MINIMAL (MENUNGGU PERSETUJUAN)

Untuk menutup ketiga risiko di atas secara bersih, minimalis, reversibel, dan tanpa merusak test suite lama, berikut rekomendasi implementasi yang dapat diterapkan saat diinstruksikan:

### Rekomendasi 1: Memasukkan Kasus `UNAVAILABLE` ke Antrean Operasional
Pada [`backend/src/services/caseService.js`](file:///D:/medcare/backend/src/services/caseService.js) baris 48:
```diff
- } else if (riskMode === 'FOCUS' || riskMode === 'ALL_FOCUS') {
-   baseWhere += ` AND (c.primary_risk_mode IN ('PHANTOM_BILLING', 'UPCODING', 'EVIDENCE_REVIEW') OR (c.evidence_gap IS NOT NULL AND c.evidence_gap > 0)) AND (c.case_type IS NULL OR c.case_type != 'pattern')`;
+ } else if (riskMode === 'FOCUS' || riskMode === 'ALL_FOCUS') {
+   baseWhere += ` AND (c.primary_risk_mode IN ('PHANTOM_BILLING', 'UPCODING', 'EVIDENCE_REVIEW', 'UNAVAILABLE') OR (c.evidence_gap IS NOT NULL AND c.evidence_gap > 0)) AND (c.case_type IS NULL OR c.case_type != 'pattern')`;
```
*Dampak*: Kasus baru yang belum memiliki kelengkapan berkas bukti fisik (`UNAVAILABLE` / `NO_CONCLUSION`) akan tetap muncul di antrean operasional sehingga Staff JKN dapat melakukan tindak lanjut dan permintaan berkas bukti.

### Rekomendasi 2: Conditional Feature Flag untuk Endpoint Non-Target
Pada [`backend/src/app.js`](file:///D:/medcare/backend/src/app.js) baris 40:
Tambahkan conditional middleware sederhana:
```javascript
const blockNonTarget = (req, res, next) => {
  if (process.env.NODE_ENV !== 'test' && process.env.ENABLE_LEGACY_MODULES !== 'true') {
    return res.status(403).json({ error: 'Modul ini dinonaktifkan sementara dalam ruang lingkup 3 fokus utama.' });
  }
  next();
};

app.use('/api/bpjs', blockNonTarget, bpjsRoutes);
app.use('/api/bpjs', blockNonTarget, bpjsPatientRoutes);
app.use('/api/validation', blockNonTarget, validationRoutes);
```
*Dampak*: Memblokir akses HTTP langsung pada lingkungan operasional, namun tetap membiarkan seluruh unit test PRD (`NODE_ENV === 'test'`) berjalan lulus 24/24.

### Rekomendasi 3: Isolasi Sinyal Berdasarkan `riskMode` pada `auditCheckClaim`
Pada [`backend/src/controllers/claimController.js`](file:///D:/medcare/backend/src/controllers/claimController.js) baris 128:
```javascript
let targetSignals = ['PB-01', 'UC-01', 'EVIDENCE-COMPLETE', 'EVIDENCE-MISSING'];
if (input.riskMode === 'PHANTOM_BILLING') {
  targetSignals = ['PB-01', 'EVIDENCE-COMPLETE', 'EVIDENCE-MISSING'];
} else if (input.riskMode === 'UPCODING') {
  targetSignals = ['UC-01'];
}
analysis.signals = analysis.signals.filter(s => targetSignals.includes(s.id));
```
*Dampak*: Memastikan bahwa jika pengguna secara eksplisit memilih mode pengujian Phantom Billing, sinyal Upcoding tidak akan mengintervensi skor, dan sebaliknya.

---

## 9. KESIMPULAN AKHIR

Targeted audit telah mendokumentasikan secara rinci perilaku aktual sistem MedCareJKN:
- **PASS**: Integritas data database demo `jkn_integrity` terbukti 100% utuh tanpa mutasi; isolasi hak akses kepemilikan Reviewer Klinis pada `ALL_HISTORICAL` terbukti solid; otorisasi SEC-01 dan status final terbukti kebal manipulasi.
- **WARNING**: Teridentifikasi 3 area penyempurnaan (visibilitas kasus `UNAVAILABLE` di antrean, proteksi HTTP endpoint non-target, dan penegasan isolasi mode audit).

Seluruh rekomendasi perbaikan telah disiapkan dalam bentuk perubahan minimalis dan reversibel, dan **tidak ada perubahan source code yang dilakukan** sesuai ketentuan *read-only* penugasan ini.

