# DOKUMENTASI IMPLEMENTASI PENYEDERHANAAN FITUR MEDCAREJKN
## 3 FOKUS UTAMA: PHANTOM BILLING, UPCODING, DAN EVIDENCE REVIEW

**Tanggal Implementasi**: 30 Oktober 2026  
**Aplikasi**: MedCareJKN  
**Lingkungan**: Lokal (`D:\medcare`)  
**Database Demo**: PostgreSQL `jkn_integrity` (Status: 100% Utuh, 0 Baris Dimutasi/Dihapus)  
**Status Pengujian**: 24/24 Backend Unit & Integration Tests Pass, 10/10 SEC-01 Hardening Tests Pass, Frontend Vite Build 100% Sukses

---

## 1. TIGA FOKUS BISNIS YANG DIPERTAHANKAN

Aplikasi MedCareJKN telah disederhanakan secara komprehensif agar berfokus secara eksklusif pada 3 pilar fungsional deteksi kecurangan dan audit klaim:

| No | Fitur / Domain Utama | Rule ID / Mesin Fondasi | Bobot / Ambang Batas | Karakteristik & Parameter Utama | Perilaku & Guardrail |
|---|---|---|---|---|---|
| 1 | **PHANTOM BILLING** | Rule `PB-01` | Bobot: 65 (Ambang: `unsupportedQuantity > 0`) | `evidenceAvailable`, `claimedQty`, `supportedQty`, `unsupportedQuantity` | Memicu skor risiko 65 (Prioritas HIGH) bila kuantitas klaim melebihi bukti fisik. Jika berkas fisik tidak ada (`evidenceAvailable === false`), sistem menerapkan guardrail `NO_CONCLUSION` (bukan vonis fraud otomatis). |
| 2 | **UPCODING** | Rule `UC-01` | Bobot: 35 (Ambang: `tariffGap > 0`) | `amountBilled`, `referenceTariff`, `tariffGap` | Memicu skor risiko 35 (Prioritas MEDIUM) bila nilai tagihan melampaui tarif acuan terverifikasi INA-CBG. Evaluasi dilakukan berbasis perbandingan numerik selisih tarif (`tariffGap > 0`), bukan analisis NLP keparahan klinis. |
| 3 | **EVIDENCE REVIEW** | Mesin Rekonsiliasi Bukti (`evidenceReconciliation.js`, `caseContract.js`) | Ketercakupan & Disparitas (Non-Skor) | `itemContract()`, `reconcileItem()`, status `SUPPORTED`, `PARTIAL`, `UNSUPPORTED`, `UNAVAILABLE`, `evidenceGap`, `evidenceCoveragePct` | Beroperasi sebagai fondasi rekonsiliasi bukti per butir tindakan/obat dan per klaim. Menghitung kesenjangan kuantitas bukti (`evidenceGap`) dan persentase ketercakupan (`evidenceCoveragePct`). |

---

## 2. FITUR YANG DINONAKTIFKAN SEMENTARA (REVERSIBEL)

Penyederhanaan dilakukan melalui mekanisme **allowlist dan routing/UI gating reversibel**, tanpa menghapus source code lama dan tanpa merusak stabilitas konfigurasi rule (`ruleConfigHash`):

1. **Modul Katalog Data BPJS 2025**:
   - Komponen: `frontend/src/pages/BpjsDataPage.jsx`, endpoint `/api/bpjs/catalog`, `/tables`, `/download`.
   - Tindakan: Tombol navigasi "Data BPJS" dihilangkan dari `MedcareHeader.jsx` dan routing utama. Source code dan endpoint tetap utuh.
2. **Modul Deteksi Anomali Tren Bulanan BPJS**:
   - Komponen: `frontend/src/components/medcare/BpjsAnomalyExplorer.jsx`, endpoint `/api/bpjs/anomalies`.
   - Tindakan: Dikeluarkan dari tampilan dashboard operasional dan antrean klaim aktif.
3. **Modul Simulasi Audit Pasien SQLite**:
   - Komponen: `frontend/src/pages/BpjsAuditPage.jsx`, file database SQLite (`bpjs-patients.sqlite`), `backend/src/routes/bpjsPatientRoutes.js`.
   - Tindakan: Navigasi "Audit Pasien BPJS" dialihkan langsung ke formulir **Uji Klaim Manual** (`ClaimAuditInputPage.jsx`). Tautan tombol antrean SQLite dari halaman kasus dihilangkan.
4. **Modul Validation & Benchmark AI**:
   - Komponen: `frontend/src/pages/ValidationPage.jsx`, endpoint `/api/validation`.
   - Tindakan: Tab navigasi "AI & Validasi" dihilangkan dari bilah navigasi utama. File dan logic benchmarking tetap dipertahankan.
5. **Mode Risiko Non-Target pada Engine Operasional**:
   - Mode non-target: `UNNECESSARY_PROCEDURES` (Rule `UP-01`), `DUPLICATE_CLAIM` (Rule `DC-01`), `WRONG_DIAGNOSIS` (Rule `WD-01`), `GHOST_ENROLLEE` (Rule `GE-01`).
   - Tindakan: Dikeluarkan dari opsi dropdown antrean dan formulir uji klaim baru. API `auditCheckClaim` menolak atau menyaring parameter non-target tersebut ke dalam allowlist 3 fitur fokus. Definisi konfigurasi di `config/risk_rules.json` **TIDAK diubah** agar `ruleConfigHash` pada test validasi tetap identik.
6. **Kasus Pola Agregat BPJS (`PATTERN_REVIEW` / `CASE-PAT`)**:
   - Tindakan: Disaring keluar dari kueri antrean operasional individual klaim dan ringkasan dashboard operasional (`WHERE (c.primary_risk_mode IS NULL OR c.primary_risk_mode != 'PATTERN_REVIEW') AND (c.case_type IS NULL OR c.case_type != 'pattern')`). Seluruh 12 kasus historis di database tetap tersimpan rapi tanpa mutasi.

---

## 3. INFRASTRUKTUR PENDUKUNG YANG DIPERTAHANKAN

Seluruh infrastruktur produksi internal yang esensial tetap berfungsi normal:
- **Autentikasi & Sesi**: Login berbasis JWT dan token sesi untuk `staff_jkn` dan `clinical_reviewer`.
- **Role-Based Access Control (RBAC)**: Pemisahan hak akses antara Staff JKN (triase, penugasan, registrasi sanggahan faskes) dan Reviewer Klinis (tinjauan medis, penilaian outcome klinis).
- **Hardening Keamanan SEC-01**:
  - `POST /api/cases/:caseId/dispute` mewajibkan otorisasi ketat role `staff_jkn` via middleware route dan service layer.
  - Validasi boolean ketat: `payload.allowRevision === true` (hanya boolean `true` murni oleh Staff JKN yang dapat mengaktifkan revisi kasus final).
  - Kasus final (`CONFIRMED`, `NOT_CONFIRMED`, `CLOSED`) terlindungi dari bypass action non-dispute.
- **Workflow Telaah Dokter & Penugasan**:
  - Penugasan dokter (`dr.anindya`, `dr.budi`, `dr.ratna`).
  - Isolasi antrean dokter berdasarkan `assigned_to`.
  - Formulir telaah outcome medis (`CONFIRMED`, `NOT_CONFIRMED`, `NEEDS_MORE_EVIDENCE`, `FALSE_POSITIVE`, `ESCALATED`).
- **Evidence Chain & Audit Trail**:
  - Formulir unggah dokumen bukti pendukung dan penautan butir layanan.
  - Pencatatan permanen pada tabel `audit_logs`.
  - Sistem notifikasi in-app untuk pembaruan kasus dan penugasan.

---

## 4. CARA KERJA EVIDENCE REVIEW SEBAGAI RECONCILIATION ENGINE

Berdasarkan investigasi arsitektur:
1. `EVIDENCE_REVIEW` **bukan rule penambah skor** di dalam `config/risk_rules.json`. Sistem tidak menambahkan rule tiruan `ER-01` yang dapat mendistorsi agregasi skor atau merusak `ruleConfigHash`.
2. Evidence Review diimplementasikan melalui **mesin rekonsiliasi deterministik**:
   - `shared/caseContract.js` (`itemContract`, `evidenceContract`, `eventContract`).
   - Setiap item tagihan diklasifikasikan status dukungannya:
     - `SUPPORTED`: Kuantitas didukung bukti fisik >= kuantitas tagihan.
     - `PARTIAL`: Kuantitas didukung bukti fisik > 0 namun < kuantitas tagihan.
     - `UNSUPPORTED`: Kuantitas didukung = 0 atau bukti tidak cocok.
     - `UNAVAILABLE`: Berkas bukti belum diunggah atau tidak tersedia.
   - Perhitungan kesenjangan bukti:
     $$\text{evidenceGap} = \max(0, \text{claimedQuantity} - \text{supportedQuantity})$$
   - Perhitungan persentase ketercakupan:
     $$\text{evidenceCoveragePct} = \min\left(100, \text{round}\left(\frac{\text{supportedQuantity}}{\text{claimedQuantity}} \times 100\right)\right)$$
3. **Penyaringan Antrean Evidence Review**:
   Kueri filter antrean `riskMode === 'EVIDENCE_REVIEW'` menyaring kasus dengan kondisi nyata:
   `c.primary_risk_mode = 'EVIDENCE_REVIEW' OR (c.evidence_gap IS NOT NULL AND c.evidence_gap > 0)`
   sehingga mencakup baik kasus historis berlabel `EVIDENCE_REVIEW` maupun kasus klaim yang memiliki disparitas bukti layanan.

---

## 5. PEMBATASAN RULE ENGINE & API PADA AUDIT BARU

Pada endpoint `POST /api/claims/audit-check` (`backend/src/controllers/claimController.js`):
1. **Gating Mode Risiko**:
   Jika request body mengirimkan `riskMode` di luar allowlist target (`['ALL', 'PHANTOM_BILLING', 'UPCODING', 'EVIDENCE_REVIEW']`), endpoint merespons dengan HTTP 400:
   `"Mode risiko dinonaktifkan sementara. Fitur aktif: PHANTOM_BILLING, UPCODING, EVIDENCE_REVIEW."`
2. **Sanitasi Parameter Masukan**:
   Hanya parameter terkait 3 fokus yang diproses:
   - `amountBilled` & `referenceTariff` (menghitung `tariffGap = max(0, amountBilled - referenceTariff)` untuk Upcoding).
   - `claimedQty`, `supportedQty`, `evidenceAvailable` (mengevaluasi Phantom Billing dan Rekonsiliasi Bukti).
   - Parameter non-target (`procedureIndication`, `duplicateCount`, `diagnosisProcedureMatch`, `enrollmentValid`) disaring keluar.
3. **Allowlist Sinyal Aturan**:
   Sinyal hasil analisis difilter ketat melalui allowlist aktif:
   `const ALLOWED_SIGNALS = ['PB-01', 'UC-01', 'EVIDENCE-COMPLETE', 'EVIDENCE-MISSING'];`
   Skor risiko dihitung ulang hanya dari bobot aturan aktif yang terpicu.
   Penentuan `primaryRiskMode` dipetakan secara eksklusif ke:
   - `PHANTOM_BILLING` (jika `PB-01` terpicu).
   - `UPCODING` (jika `UC-01` terpicu).
   - `EVIDENCE_REVIEW` (jika terdapat disparitas bukti / `evidenceGap > 0`).
   - `UNAVAILABLE` (jika bukti tidak tersedia / guardrail aktif).
   - `NO_FRAUD` (jika seluruh kuantitas didukung dan tarif sesuai acuan).

---

## 6. PENANGANAN DATA HISTORIS DATABASE

Status integritas database PostgreSQL demo `jkn_integrity`:
- **Jumlah Total Kasus**: Tetap 37 baris (0 baris dihapus, 0 baris dimutasi).
- **Rincian Data Tersimpan**:
  - 14 Kasus `PHANTOM_BILLING` (Klaim individual).
  - 1 Kasus `UPCODING` (`CASE-PB-003`).
  - 8 Kasus `EVIDENCE_REVIEW` (`CASE-0017` s/d `CASE-0024`, gap = 3.00).
  - 12 Kasus `PATTERN_REVIEW` (`CASE-0009` s/d `0016`, `CASE-0037` s/d `0040`).
  - 1 Kasus `DUPLICATE_CLAIM` (`CASE-PB-004`).
  - 1 Kasus `UNNECESSARY_PROCEDURES` (`CASE-PB-006`).
- **Pemisahan Pengalaman Pengguna**:
  - Pada antrean fokus default (`riskMode: 'FOCUS'`): Menampilkan tepat **23 kasus klaim individual** dari 3 fokus target (14 PB + 1 UC + 8 ER).
  - Kasus agregat pola (`PATTERN_REVIEW`) dan modus historis non-target tidak bercampur dengan antrean aktif.
  - Untuk kebutuhan audit historis lengkap, parameter `riskMode: 'ALL_HISTORICAL'` tetap tersedia dan mengembalikan seluruh 37 kasus.

---

## 7. PERUBAHAN NAVIGASI & DASHBOARD

### A. Navigasi (`MedcareHeader.jsx` & `App.jsx`)
Menu navigasi atas disederhanakan menjadi 4 menu esensial:
1. **Beranda** (`landing`) — Dashboard metrik 3 fokus.
2. **Antrean Kasus** (`cases`) — Daftar kasus klaim dengan filter 3 domain utama.
3. **Uji Klaim Manual** (`input`) — Formulir simulasi pengujian klaim fokus PB, UC, dan Bukti.
4. **Panduan** (`guide`) — Dokumentasi dan kamus audit.

*Tab yang dihilangkan dari navigasi:* "Data BPJS" (`bpjs`), "Audit Pasien BPJS" (modul SQLite), "AI & Validasi" (`validation`).

### B. Dashboard (`MedcareMinimalistDashboard.jsx` & `dashboardService.js`)
- KPI fokus mencakup:
  - Total Kasus Klaim Terdata: 23 kasus klaim individual aktif (bukan 37 kasus campuran agregat).
  - Kasus Prioritas Tinggi (HIGH): 8 kasus.
  - Rata-rata Ketercakupan Bukti (`evidenceCoverage`): 73.33% berbasis data rekonsiliasi klaim.
  - Kasus Terukur (`measuredCases`): 21 kasus.
- Seluruh metrik berasal langsung dari kueri PostgreSQL database demo `jkn_integrity`, tanpa mock data atau sintetis.

### C. Antrean Kasus (`CasesPage.jsx`)
- Filter mode risiko disederhanakan menjadi:
  1. `Semua Fokus Utama` (Value: `FOCUS`) — 23 kasus.
  2. `Indikasi Phantom Billing` (Value: `PHANTOM_BILLING`) — 14 kasus.
  3. `Indikasi Upcoding` (Value: `UPCODING`) — 1 kasus.
  4. `Kesenjangan Bukti Layanan` (Value: `EVIDENCE_REVIEW`) — 8 kasus.
- Filter kode alasan dibatasi pada aturan aktif:
  1. `Semua Kode Alasan` (`ALL`).
  2. `PB-01 · Item ditagihkan melebihi bukti layanan`.
  3. `UC-01 · Tarif tagihan melampaui tarif pembanding`.
- `ReasonChips` hanya menampilkan chip untuk sinyal aktif `PB-01` dan `UC-01`.

### D. Uji Klaim Manual (`ClaimAuditInputPage.jsx`)
- Preset skenario diperbarui:
  1. `Indikasi Phantom Billing (PB-01)`: Kuantitas tagihan 10 vs bukti 2 (Gap 8, Skor 65, HIGH).
  2. `Indikasi Upcoding (UC-01)`: Tagihan Rp32.000.000 vs tarif acuan Rp22.400.000 (Gap Rp9.600.000, Skor 35, MEDIUM).
  3. `Kesenjangan Bukti Layanan`: Tagihan 5 vs bukti 2 (Gap 3, Coverage 40%, Prioritas Review).
  4. `Klaim Wajar & Terverifikasi`: Kuantitas didukung 100%, tarif sesuai acuan (Skor 0, LOW).
  5. `Berkas Fisik Belum Tersedia`: Ketiadaan berkas memicu guardrail `NO_CONCLUSION` (Skor 0, tidak divonis fraud).
- Input formulir dilengkapi kolom **Tarif Acuan Standar INA-CBG (Rp)** untuk pengujian Upcoding. Field non-target (`diagnosisProcedureMatch`, `enrollmentValid`) dihilangkan.

---

## 8. HASIL PENGUJIAN REGRESI

Semua pengujian dijalankan di lingkungan lokal terisolasi:

```text
> jkn-integrity-backend@1.0.0 test
> node --test tests/**/*.test.js

✔ BUG-09: response and legacy browser identity remove credentials (3.11ms)
✔ BPJS catalog excludes reference rows and keeps cohort scope (2.17ms)
✔ BPJS HTTP catalog, table and whitelisted downloads (134.89ms)
✔ BPJS detail returns only selected source, code mapping and explicit preview scope (0.42ms)
✔ BPJS missing extraction is unavailable, not fabricated data (2.57ms)
✔ BPJS evidence scenarios preserve unavailable, zero amounts and explicit simulated support (1.18ms)
✔ BPJS missing index reports a server setup problem and recovers when data is installed (7.70ms)
✔ BPJS patient to encounter to persistent case and reviewer trace, with cohort isolation (357.76ms)
✔ BUG-01: fallback and partial result render without throwing (118.78ms)
✔ BUG-03/08: canonical evidence and event contract preserve missing status and quantity zero (0.73ms)
✔ rule score is explainable, zero billing alone is not an anomaly (0.47ms)
✔ verified evidence supersedes unavailable references and duplicate documents do not inflate quantity (0.56ms)
✔ Decision Engine: Full Support (1.24ms)
✔ Decision Engine: Partial Support (0.24ms)
✔ Decision Engine: Phantom Billing (CASE-0025 Scenario) (0.16ms)
✔ Decision Engine: Safety Guardrail for Unavailable Evidence (CASE-0033 Scenario) (0.29ms)
✔ Decision Engine: Pattern Review (CASE-0037 Scenario) (1.21ms)
✔ F3: known metrics, ties, capacity and deterministic benchmark (243.36ms)
✔ F4: configured weight changes actual score and explanations sum to score (1.12ms)
✔ F5: copilot is sourced, deterministic and requires matching metadata, not filename presence (0.80ms)
✔ F6: rolling baseline excludes present/future and reports source fields (14.48ms)
✔ F5: all eight seeded cases retain configured, sourced evidence requirements (8.24ms)
✔ SEC-01: Dispute Endpoint Role-Based Authorization, Strict allowRevision, & Final Status Hardening (2052.95ms)
✔ PRD: persistent core, idempotent migration, auth guards and resilient audit contract (2320.46ms)
ℹ tests 24 | suites 0 | pass 24 | fail 0 | cancelled 0 | duration_ms 3321.00ms
```

### Hasil Uji Verifikasi 3 Fokus (`verify_3_focus.mjs`):
1. **Phantom Billing (PB-01)**: Sinyal `PB-01` terpicu, `primaryRiskMode: 'PHANTOM_BILLING'`, Skor 65, Prioritas HIGH, Kesenjangan 8, Ketercakupan 20%. Status: **LULUS**.
2. **Upcoding (UC-01)**: Sinyal `UC-01` terpicu, `primaryRiskMode: 'UPCODING'`, Skor 35, Prioritas MEDIUM, `tariffGap` Rp9.600.000. Status: **LULUS**.
3. **Safety Guardrail Ketiadaan Bukti**: `evidenceAvailable: false` menghasilkan `riskScore: 0`, `reviewPriority: 'NO_CONCLUSION'`, `primaryRiskMode: 'UNAVAILABLE'`. Status: **LULUS**.
4. **Rekonsiliasi Bukti Layanan**: Tagihan 5 vs didukung 2 menghasilkan `evidenceGap: 3`, `evidenceCoveragePct: 40%`. Status: **LULUS**.
5. **Integritas Database `jkn_integrity`**: Total baris tabel `cases`: tepat 37 baris. FOCUS queue: 23 baris. PB: 14 baris. UC: 1 baris. ER: 8 baris. ALL_HISTORICAL: 37 baris. Status: **LULUS**.

### Hasil Frontend Production Build:
```text
> vite build
✓ 2319 modules transformed.
dist/index.html                                 1.01 kB │ gzip:   0.56 kB
dist/assets/index-rZvZnaKS.css                 51.15 kB │ gzip:  10.65 kB
dist/assets/ClaimAuditInputPage-Ben3-5oa.js    22.23 kB │ gzip:   5.75 kB
dist/assets/CasesPage-J3y4XDnT.js              31.81 kB │ gzip:   7.63 kB
dist/assets/MedcareLanding-DTKFMsc-.js         36.17 kB │ gzip:  12.19 kB
dist/assets/index-DSrVLJWP.js                 344.43 kB │ gzip: 107.31 kB
✓ built in 3.89s
```
Status: **0 error, build sukses sempurna**.

---

## 9. CARA MENGAKTIFKAN KEMBALI FITUR NON-TARGET

Karena seluruh fitur non-target dinonaktifkan secara reversibel tanpa penghapusan kode:
1. **Mengaktifkan kembali Tab Navigasi Data BPJS & Validasi**:
   Pada `frontend/src/components/layout/MedcareHeader.jsx`, tambahkan kembali objek navigasi `{ key: 'bpjs', label: 'Data BPJS', onClick: onOpenBpjs }` dan `{ key: 'validation', label: 'AI & Validasi', onClick: onOpenValidation }` ke dalam array `navItems`.
2. **Mengaktifkan kembali Modul SQLite Audit Pasien**:
   Pada `frontend/src/App.jsx`, kembalikan perutean `view === 'input'` untuk merender `<BpjsAuditPage />`.
3. **Mengaktifkan kembali Kasus Agregat `PATTERN_REVIEW` pada Antrean**:
   Pada `backend/src/services/caseService.js`, ubah filter default pada kondisi `riskMode === 'ALL'` agar tidak mengecualikan `case_type === 'pattern'`.
4. **Membuka Kembali Aturan Non-Target pada API Audit Baru**:
   Pada `backend/src/controllers/claimController.js`, tambahkan ID aturan `['UP-01', 'DC-01', 'WD-01', 'GE-01']` ke dalam array `ALLOWED_SIGNALS` dan kembalikan penanganan parameter `procedureIndication`, `duplicateCount`, dsb.

---

## 10. RISIKO DAN KETERBATASAN YANG TERSISA

1. **Keterbatasan Evaluasi Upcoding Numerik**:
   Rule `UC-01` saat ini beroperasi murni berdasarkan selisih angka tarif (`amountBilled - referenceTariff > 0`). Sistem tidak melakukan natural language processing (NLP) atau inferensi tingkat keparahan diagnosis (severity level) secara otomatis dari teks resume medis.
2. **Dataset Kasus Upcoding Historis Terbatas**:
   Di dalam dataset seed demo `jkn_integrity`, hanya terdapat 1 kasus historis berlabel `UPCODING` (`CASE-PB-003`). Namun, fitur Uji Klaim Manual (`ClaimAuditInputPage.jsx`) telah dilengkapi preset dan masukan tarif acuan INA-CBG untuk memvalidasi skenario Upcoding baru kapan pun dibutuhkan.
3. **Pemisahan Kasus Pola Agregat dari Antrean Operasional**:
   Kasus tren bulanan agregat BPJS (`PATTERN_REVIEW`) tidak lagi muncul di antrean operasional klaim individual staf/dokter. Untuk meninjau data tersebut di masa mendatang, auditor dapat menggunakan parameter kueri eksplisit `riskMode=ALL_HISTORICAL` atau mengaktifkan kembali modul explorer terkait.

