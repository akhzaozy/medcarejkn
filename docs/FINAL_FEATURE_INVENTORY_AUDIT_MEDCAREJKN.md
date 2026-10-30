# FINAL FEATURE INVENTORY & AUDIT MEDCAREJKN
## Laporan Pemetaan Fitur Aktual, Modus Risiko, Jalur API, & Kesiapan Penyederhanaan Produk

> **Dokumen Audit Teknis — Berdasarkan Kode Sumber Aktual (Read-Only)**  
> **Tanggal Pemeriksaan:** 30 Oktober 2026  
> **Repositori Kerja:** `D:\medcare`  
> **Target Penyederhanaan:** Tiga Fitur Inti (**1. PHANTOM BILLING**, **2. UPCODING**, **3. EVIDENCE REVIEW**)

---

## 1. RINGKASAN SELURUH FITUR APLIKASI

Aplikasi MedCareJKN saat ini merupakan platform terintegrasi yang memiliki **tiga domain arsitektur fungsional**:

```mermaid
graph TD
    A["MedCareJKN Application Shell"] --> B["1. Core JKN Integrity Track (PostgreSQL)"]
    A --> C["2. BPJS Sample 2025 Explorer (SQLite & Flatfile)"]
    A --> D["3. AI Benchmark & Calibration (Static Synthetic)"]

    B --> B1["Klaim & Rekonsiliasi Bukti Medis"]
    B --> B2["Decision Rule Engine (PB, UC, UP, DC, WD, GE)"]
    B --> B3["Investigasi, Penugasan & Putusan DPJP"]
    B --> B4["Sanggahan Faskes & Rekonsiliasi (SEC-01)"]
    B --> B5["Jejak Audit & Notifikasi Antar-Role"]

    C --> C1["Katalog Tabel Sampel BPJS 2025"]
    C --> C2["Eksplorasi Anomali Bulanan (Monthly Trends)"]
    C --> C3["Audit Simulasi Pasien BPJS (SQLite)"]

    D --> D1["Benchmark ROC/AUC & Matrix Konfusi"]
    D --> D2["Kalibrasi Bobot Aturan & Feedback Dokter"]
```

1. **Core JKN Integrity Track (PostgreSQL `jkn_integrity`):**  
   Fokus pada tata kelola audit investigasi klaim individual, rekonsiliasi kuantitas tindakan klaim terhadap bukti fisik/digital rekam medis, rule engine deteksi anomali, penugasan dokter verifikator klinis, alur sanggahan faskes (*dispute*), hingga penetapan keputusan telaah medis (*review outcome*). Ini merupakan **pondasi utama sistem**.
2. **BPJS Sample 2025 Explorer & Simulation (SQLite `bpjs-patients.sqlite` & `audit.sqlite`):**  
   Modul paralel yang menyajikan katalog data makro BPJS 2025, unduhan data, analisis anomali tren bulanan, penelusuran riwayat peserta BPJS, dan simulasi audit berbasis SQLite.
3. **AI Benchmark & Calibration Engine:**  
   Modul validasi performa aturan risiko berbasis dataset sintetis benchmark, visualisasi ROC/AUC, matrix konfusi, dan kalibrasi bobot berdasarkan feedback dokter penelaah.

---

## 2. DAFTAR HALAMAN DAN MENU FRONTEND

Pemeriksaan mendalam terhadap seluruh file di `frontend/src/pages/`, `frontend/src/components/`, dan `frontend/src/App.jsx` mengidentifikasi komponen aktif dan komponen tidak terpakai (*dead code*):

| Nama Fitur / Layar | File Utama | Fungsi Aktual | Role Pengguna | API Terkait | Status Implementasi | Ketergantungan |
|---|---|---|---|---|---|---|
| **Portal Masuk (Login & Switcher)** | `frontend/src/pages/LoginPage.jsx` | Autentikasi sesi, pemilihan profil simulasi Staff JKN / Dokter Penelaah, dan mode demo instan | Semua Pengguna | `POST /api/auth/login`, `GET /api/auth/roles` | **Aktif Penuh** | `auth_sessions`, `app_users` |
| **Navigasi Global & Notifikasi** | `frontend/src/components/layout/MedcareHeader.jsx` | Header aplikasi serumpun, navigasi tab, profil pengguna, dan pusat notifikasi lonceng | Semua Pengguna | `GET /api/notifications`, `POST /api/notifications/read-all` | **Aktif Penuh** | `notificationService`, `users.js` |
| **Dashboard Ringkasan Eksekutif** | `frontend/src/pages/MedcareLanding.jsx` & `MedcareMinimalistDashboard.jsx` | Menampilkan metrik finansial, skor integritas, tren audit bulanan, kasus prioritas, dan jadwal verifikasi lapangan | Semua Pengguna (Filter sesuai peran) | `GET /api/dashboard` | **Aktif Penuh** | `dashboardService`, `cases`, `claims` |
| **Antrean Kasus Klaim (Queue)** | `frontend/src/pages/CasesPage.jsx` | Antrean berkas klaim terintegrasi dengan filter status pipeline, tingkat prioritas, mode risiko, pencarian faskes/pasien, dan paginasi | Staff JKN & Clinical Reviewer (terfilter) | `GET /api/cases` | **Aktif Penuh** | `caseService`, `cases` |
| **Detail Kasus & Rekonsiliasi Bukti** | `frontend/src/pages/CaseDetailPage.jsx` | Ruang kerja audit mendalam: fact sheet, perbandingan item klaim vs bukti, histori skor, tindakan klaim, Copilot evidence gap, form sanggahan faskes, dan putusan telaah klinis | Staff JKN (Triage/Dispute/Schedule) & Clinical Reviewer (Review/Outcome) | `GET /api/cases/:id`, `POST /outcome`, `POST /assign`, `POST /dispute`, `POST /evidence`, `POST /copilot`, `POST /feedback` | **Aktif Penuh** | `caseService`, `caseContract`, `riskEngine`, `evidenceCopilot` |
| **Audit Klaim Mandiri (Manual)** | `frontend/src/pages/ClaimAuditInputPage.jsx` | Formulir interaktif untuk menguji kalkulasi rule engine terhadap parameter klaim manual dengan opsi simpan kasus | Semua Pengguna | `POST /api/claims/audit-check` | **Aktif Penuh** | `riskEngine`, `claimController` |
| **Katalog Data BPJS 2025** | `frontend/src/pages/BpjsDataPage.jsx` | Eksplorasi skema tabel sampel BPJS 2025, distribusi variabel, contoh data, dan unduhan file Excel/ZIP | Semua Pengguna | `GET /api/bpjs/catalog`, `GET /api/bpjs/tables/:id`, `GET /api/bpjs/download/:type` | **Aktif Mandiri** | File lokal `outputs/bpjs-2025/` |
| **Deteksi Anomali Tren BPJS** | `frontend/src/components/common/BpjsAnomalyExplorer.jsx` | Penelusuran lonjakan tagihan bulanan makro (deviasi median 3 bulan) dan konversi ke kasus pola (`CASE-PAT`) | Staff JKN | `GET /api/bpjs/anomalies`, `POST /api/bpjs/anomalies/cases` | **Aktif Mandiri** | `bpjsAnomalyService` |
| **Simulasi Audit Pasien BPJS** | `frontend/src/pages/BpjsAuditPage.jsx` | Penelusuran riwayat encounter pasien dari SQLite dan simulasi audit skenario bukti tambahan | Semua Pengguna | `GET /api/bpjs/patients`, `GET /api/bpjs/encounters/:id`, `POST/GET /api/bpjs/audits` | **Aktif Mandiri** | `bpjs-patients.sqlite`, `audit.sqlite` |
| **Validasi & Benchmark AI** | `frontend/src/pages/ValidationPage.jsx` | Tampilan metrik validasi AI (ROC-AUC, Matrix Konfusi, Presisi@K) dan kalibrasi aturan terhadap benchmark | Semua Pengguna | `GET /api/validation` | **Aktif Mandiri** | `validation_report.json`, `validationService` |
| **Panduan & Kamus MedCare** | `frontend/src/pages/GuidePage.jsx` | Dokumentasi onboard, kamus istilah audit medis, glosarium, dan panduan SOP pembuktian | Semua Pengguna | Tanpa API (statis) | **Aktif Penuh** | Independen |
| *Legacy Dashboard* | `frontend/src/pages/DashboardPage.jsx` | Halaman dashboard versi awal | - | - | **Tidak Aktif (Dead Code)** | Tidak diimpor oleh `App.jsx` |
| *Legacy Navbar* | `frontend/src/components/layout/Navbar.jsx` | Komponen navigasi versi awal | - | - | **Tidak Aktif (Dead Code)** | Digantikan oleh `MedcareHeader.jsx` |
| *Komponen Ilustrasi Terisolasi* | `CalendarArt.jsx`, `DoctorAvatars.jsx`, `DoctorMascotAvatar.jsx`, `HeroDoctorArt.jsx`, `ServiceDoctorArt.jsx` | Komponen visual SVG/avatar | - | - | **Tidak Aktif (Dead Code)** | Tidak dipanggil di komponen aktif |
| *Modal/Card Non-Aktif* | `MedcareDoctorVideoCard.jsx`, `MedcareTeleConsultModal.jsx`, `MedcareVerificationDetailModal.jsx`, `AnimatedAlertModal.jsx` | Prototipe video call & telekonsultasi dokter | - | - | **Tidak Aktif (Placeholder)** | Tidak dihubungkan ke workflow |

---

## 3. INVENTARISASI SELURUH MODUS DETEKSI RISIKO

Seluruh konfigurasi aturan risiko sistem didefinisikan secara deklaratif pada [`config/risk_rules.json`](file:///D:/medcare/config/risk_rules.json) dan diproses secara deterministik oleh [`shared/riskEngine.js`](file:///D:/medcare/shared/riskEngine.js):

| Kode Risk Mode | Nama Tampilan | Rule ID | Bobot | Kondisi Pemicu | Formula Perhitungan | File Sumber | Endpoint Pemrosesan | Keluaran Sinyal | Hubungan Status & Prioritas |
|---|---|---|---|---|---|---|---|---|---|
| **`PHANTOM_BILLING`** | Indikasi Phantom Billing | `PB-01` | **65** | Kuantitas tagihan melampaui bukti layanan (`unsupportedQuantity > 0`) dan bukti tersedia (`evidenceAvailable === true`) | `unsupportedQuantity = claimedQty - supportedQty` | `risk_rules.json`, `riskEngine.js`, `evidenceReconciliation.js` | `POST /api/claims/audit-check`, `GET /api/cases/:id` | Sinyal bobot 65, `isPhantom: true`, selisih gap bukti | Mengangkat prioritas ke **`HIGH`** (Skor $\ge 60$); status awal `OPEN` |
| **`UPCODING`** | Indikasi Upcoding | `UC-01` | **35** | Tarif tagihan melebihi tarif pembanding acuan terverifikasi (`tariffGap > 0`) | `tariffGap = total_amount - tariff_ina_cbg` | `risk_rules.json`, `riskEngine.js` | `POST /api/claims/audit-check`, `GET /api/cases/:id` | Sinyal bobot 35, evaluasi kesesuaian severity level klaim | Mengangkat prioritas ke **`MEDIUM`** (Skor 30–59); status awal `OPEN` |
| **`UNNECESSARY_PROCEDURES`** | Indikasi Prosedur Perlu Telaah | `UP-01` | **45** | Indikasi klinis prosedur ditandai tidak sesuai pada telaah terstruktur (`procedureIndication === false`) | Pengecekan boolean eksplisit field `procedureIndication` | `risk_rules.json`, `riskEngine.js` | `POST /api/claims/audit-check`, `GET /api/cases/:id` | Sinyal bobot 45, rekomendasi klarifikasi indikasi DPJP | Menghasilkan prioritas **`MEDIUM`**; status awal `OPEN` |
| **`DUPLICATE_CLAIM`** | Indikasi Klaim Serupa | `DC-01` | **55** | Ditemukan lebih dari satu klaim serupa dalam kelompok pembanding (`duplicateCount > 1`) | Evaluasi integer field `duplicateCount` | `risk_rules.json`, `riskEngine.js` | `POST /api/claims/audit-check`, `GET /api/cases/:id` | Sinyal bobot 55, komparasi tanggal & layanan | Menghasilkan prioritas **`MEDIUM`**; status awal `OPEN` |
| **`WRONG_DIAGNOSIS`** | Ketidaksesuaian Diagnosa | `WD-01` | **45** | Hubungan kode diagnosa ICD-10 dengan prosedur tidak sinkron (`diagnosisProcedureMatch === false`) | Pengecekan boolean eksplisit field `diagnosisProcedureMatch` | `risk_rules.json`, `riskEngine.js` | `POST /api/claims/audit-check`, `GET /api/cases/:id` | Sinyal bobot 45, konfirmasi telaah klinis | Menghasilkan prioritas **`MEDIUM`**; status awal `OPEN` |
| **`GHOST_ENROLLEE`** | Status Peserta Perlu Verifikasi | `GE-01` | **40** | Status kepesertaan terindikasi tidak valid pada master kepesertaan (`enrollmentValid === false`) | Pengecekan boolean eksplisit field `enrollmentValid` | `risk_rules.json`, `riskEngine.js` | `POST /api/claims/audit-check`, `GET /api/cases/:id` | Sinyal bobot 40, pemeriksaan kehadiran fisik | Menghasilkan prioritas **`MEDIUM`**; status awal `OPEN` |
| **`PATTERN_REVIEW`** | Tinjauan Pola Faskes | Non-Rule (Agg) | - | Deviasi volume/tagihan bulanan $> 3\times\text{MAD}$ dan rasio $> 1.5$ terhadap median 3 bulan | Robust z-score deviasi median | `bpjsAnomalyService.js`, `evidenceReconciliation.js` | `POST /api/bpjs/anomalies/cases` | Kasus pola agregat (`case_type: 'pattern'`), sinyal lonjakan faskes | Prioritas **`MEDIUM`**, status awal `NEW`, penugasan kolektif |
| **`EVIDENCE_REVIEW`** | Review Bukti Layanan | **Bukan Rule Engine** | - | **Tidak ada di `risk_rules.json`**. Hanya label statis pada dataset CSV/seed (`CASE-0017` s/d `CASE-0024`) | Label warisan seed; bukan hasil evaluasi `riskEngine` | `seed.sql`, `cases.csv` | Ditampilkan di UI via fallback formatter | Kasus klaim dengan gap bukti parsial (70% coverage) | Prioritas **`HIGH`** / `OPEN` (dari data seed) |
| **`UNAVAILABLE`** | Bukti Belum Tersedia | `EVIDENCE-MISSING` | **0** | Dokumen bukti medis fisik tidak ditemukan dalam catatan (`evidenceAvailable === false`) | Guardrail: `evidenceAvailable === false` $\rightarrow$ `NO_CONCLUSION` | `riskEngine.js`, `evidenceReconciliation.js` | Semua endpoint audit | Sinyal bobot 0, panduan minta berkas tanpa menuduh fraud | Prioritas **`NO_CONCLUSION`**, status awal `OPEN` / `NEEDS_MORE_EVIDENCE` |

---

## 4. INVENTARISASI API BACKEND

Seluruh endpoint backend terdaftar pada route Express (`backend/src/app.js`):

```mermaid
graph LR
    subgraph "API 3 Fitur Utama"
        C1["POST /api/claims/audit-check"]
        C2["GET /api/cases/:id"]
        C3["GET /api/cases/:id/evidence"]
        C4["POST /api/cases/:id/evidence"]
        C5["POST /api/cases/:id/files"]
        C6["GET /api/cases/:id/files/:fileId"]
        C7["POST /api/cases/:id/copilot"]
    end
    subgraph "API Infrastruktur Pendukung"
        I1["POST /api/auth/login"]
        I2["POST /api/auth/logout"]
        I3["GET /api/auth/me"]
        I4["GET /api/auth/roles"]
        I5["GET /api/dashboard"]
        I6["GET /api/cases"]
        I7["POST /api/cases/:id/assign"]
        I8["POST /api/cases/:id/ownership"]
        I9["POST /api/cases/:id/schedule"]
        I10["POST /api/cases/:id/dispute"]
        I11["POST /api/cases/:id/outcome"]
        I12["POST /api/cases/:id/feedback"]
        I13["GET /api/notifications"]
        I14["POST /api/notifications/read-all"]
        I15["POST /api/notifications/:id/read"]
        I16["GET /api/health"]
    end
    subgraph "API Fitur Mandiri di Luar Fokus"
        O1["GET /api/claims"]
        O2["GET /api/claims/:id"]
        O3["POST /api/analysis/run"]
        O4["GET /api/validation"]
        O5["GET /api/bpjs/catalog"]
        O6["GET /api/bpjs/tables/:id"]
        O7["GET /api/bpjs/download/:type"]
        O8["GET /api/bpjs/anomalies"]
        O9["POST /api/bpjs/anomalies/cases"]
        O10["GET /api/bpjs/patient-catalog"]
        O11["GET /api/bpjs/patients"]
        O12["GET /api/bpjs/patients/:cohort/:id"]
        O13["GET /api/bpjs/encounters/:id"]
        O14["GET /api/bpjs/audits"]
        O15["POST /api/bpjs/audits"]
        O16["GET /api/bpjs/audits/:id"]
        O17["PATCH /api/bpjs/audits/:id"]
    end
```

### Rincian Endpoint Berdasarkan Kategori:

#### A. Endpoint yang Langsung Mendukung Tiga Fitur Target
1. `POST /api/claims/audit-check`: Menghitung skor dan sinyal risiko Phantom Billing (`PB-01`), Upcoding (`UC-01`), serta gap kuantitas bukti secara real-time.
2. `GET /api/cases/:caseId`: Mengambil rincian klaim, analisis sinyal, item tindakan, bukti layanan terdaftar, dan kalkulasi rekonsiliasi bukti.
3. `GET /api/cases/:caseId/evidence`: Mengambil rantai bukti (*evidence chain*) dan item klaim terkait.
4. `POST /api/cases/:caseId/evidence`: Menautkan berkas bukti medis pendukung baru dan menghitung ulang skor risiko secara reaktif.
5. `POST /api/cases/:caseId/files`: Menerima unggahan file fisik (PDF, gambar rekam medis).
6. `GET /api/cases/:caseId/files/:fileId`: Mengunduh berkas rekam medis yang dilampirkan.
7. `POST /api/cases/:caseId/copilot`: Menghasilkan dan menyimpan draf pemetaan kesenjangan bukti (*evidence gap report*).

#### B. Endpoint Infrastruktur Pendukung Wajib
1. `POST /api/auth/login`: Autentikasi sesi berbasis JWT/session token.
2. `POST /api/auth/logout`: Menghapus sesi aktif dari basis data.
3. `GET /api/auth/me`: Verifikasi profil pengguna yang sedang login.
4. `GET /api/auth/roles`: Daftar profil dan kapabilitas role.
5. `GET /api/dashboard`: Agregasi metrik, statistik prioritas, dan antrean teratas.
6. `GET /api/cases`: Query antrean kasus klaim dengan paginasi dan filter multi-kolom.
7. `POST /api/cases/:caseId/assign`: Penugasan kasus kepada Dokter Penelaah Klinis oleh Staff JKN.
8. `POST /api/cases/:caseId/ownership`: Pengambilan klaim kasus (*triage*) oleh Staff JKN.
9. `POST /api/cases/:caseId/schedule`: Penjadwalan klarifikasi audit faskes oleh Staff JKN.
10. `POST /api/cases/:caseId/dispute`: Pencatatan sanggahan resmi faskes oleh Staff JKN dengan pengamanan SEC-01.
11. `POST /api/cases/:caseId/outcome`: Penetapan putusan telaah klinis oleh DPJP.
12. `POST /api/cases/:caseId/feedback`: Penyimpanan evaluasi akurasi model AI oleh DPJP.
13. `GET /api/notifications`: Pengambilan notifikasi pengguna yang aktif.
14. `POST /api/notifications/read-all`: Menandai seluruh notifikasi telah dibaca.
15. `POST /api/notifications/:id/read`: Menandai satu notifikasi telah dibaca.
16. `GET /api/health`: Healthcheck status server.

#### C. Endpoint Fitur Mandiri di Luar Tiga Fokus
1. `GET /api/claims` & `GET /api/claims/:id`: Query tabel klaim mentah.
2. `POST /api/analysis/run`: Batch execution rule engine terhadap seluruh klaim di PostgreSQL.
3. `GET /api/validation`: Pengambilan laporan benchmark validasi metrik AI sintetis.
4. `GET /api/bpjs/catalog`, `/tables/:id`, `/download/:type`: Eksplorasi dataset makro BPJS 2025.
5. `GET /api/bpjs/anomalies`, `POST /api/bpjs/anomalies/cases`: Analisis anomali bulanan agregat dan pembuatan kasus pola faskes.
6. `GET /api/bpjs/patient-catalog`, `/patients`, `/encounters/:id`, `/audits`: Modul simulasi audit pasien SQLite.

---

## 5. VERIFIKASI TIGA FITUR TARGET

### A. Verifikasi Fitur 1: PHANTOM BILLING
- **Status Implementasi:** **TERSEDIA PENUH & SIAP DEMO (100% COMPLETE)**
- **Ketersediaan Aturan:** Rule `PB-01` aktif pada `risk_rules.json` dengan bobot tertinggi (65).
- **Kondisi Pemicu:** Terpicu otomatis jika `evidenceAvailable === true` dan kuantitas tertagih melebihi kuantitas bukti pendukung (`unsupportedQuantity > 0`). Modul `evidenceReconciliation.js` secara deterministik menetapkan `primarySignal = 'PHANTOM_BILLING'` dan status `UNSUPPORTED` jika bukti bernilai 0.
- **Dukungan Kasus Nyata di Database:**  
  Terdapat **14 kasus berstatus `PHANTOM_BILLING`** di PostgreSQL, termasuk kasus demo utama:
  - `CASE-PB-001` (RS Citra Medika): Apendektomi laparoskopi ditagihkan tanpa bukti catatan bedah dan anestesi.
  - `CASE-PB-002` (RS Permata Bunda): Hemodialisa fiktif tanpa log fingerprint mesin presensi biometrik.
  - `CASE-PB-005` (RS Medika Sejahtera): Stent jantung tanpa rekaman angiografi.
  - `CASE-PB-007` (RS Harapan Sehat): Tagihan rawat ICU 5 hari padahal pasien berada di bangsal kelas 2.
  - `CASE-PB-008` (RS Sentosa): Radioterapi tanpa log mesin linear accelerator.
- **Keterbacaan Detail & Workflow End-to-End:**  
  Muncul di Dashboard, Filter Antrean Kasus (`CasesPage`), dan Detail Kasus (`CaseDetailPage`). Seluruh alur kerja audit klinis (triage $\rightarrow$ penugasan $\rightarrow$ unggah bukti $\rightarrow$ sanggahan $\rightarrow$ keputusan akhir $\rightarrow$ jejak audit) berjalan 100% mulus.

---

### B. Verifikasi Fitur 2: UPCODING
- **Status Implementasi:** **TERSEDIA SECARA STRUKTURAL & SIAP DEMO (COMPLETE)**
- **Ketersediaan Aturan:** Rule `UC-01` aktif pada `risk_rules.json` dengan bobot 35.
- **Kondisi Pemicu:** Terpicu ketika selisih tarif tagihan faskes terhadap tarif INA-CBG pembanding terverifikasi bernilai positif (`tariffGap > 0`).
- **Dukungan Kasus Nyata di Database:**  
  Terdapat **1 kasus unggulan demo `CASE-PB-003`** (RS Hermina Utama):
  - Diagnosa Utama: Gagal Ginjal Kronik Stadium 5 (`N18.5`).
  - Masalah Anomali: Tagihan diajukan dengan *Severity Level 3* (komplikasi berat) sebesar Rp32.000.000, padahal tarif acuan INA-CBG yang sah adalah Rp22.400.000 (*disparity/tariffGap* = Rp14.000.000 / Rp9.600.000) tanpa komplikasi medis yang memadai di rekam medis.
  - Penugasan: Tertuju kepada `dr.budi`.
- **Keterbacaan Detail & Workflow End-to-End:**  
  Tercakup dalam filter dropdown `UPCODING` di `CasesPage.jsx`, memiliki badge `Indikasi Upcoding`, dan dapat ditelaah serta diputuskan oleh `dr.budi` di `CaseDetailPage.jsx`.

---

### C. Verifikasi Fitur 3: EVIDENCE REVIEW
- **Status Implementasi:** **TERSEDIA PENUH SEBAGAI SISTEM REKONSILIASI BUKTI (TIDAK BERDIRI SEBAGAI ATURAN MANDIRI DI RULE ENGINE)**
- **Temuan Kritis Berdasarkan Kode:**
  1. **Bukan Kategori Aturan di Rule Engine:**  
     Di [`config/risk_rules.json`](file:///D:/medcare/config/risk_rules.json), **TIDAK ADA aturan risiko bernama `EVIDENCE_REVIEW`**. String `EVIDENCE_REVIEW` hanya ditemukan sebagai teks statis pengelompokan pada dataset seed `dataset/cases.csv` baris 10–17 untuk 8 kasus (`CASE-0017` s/d `CASE-0024`). Dropdown filter di `CasesPage.jsx` juga tidak memuat opsi `EVIDENCE_REVIEW`.
  2. **Implementasi Inti Sebagai Mesin Rekonsiliasi Bukti (*Evidence Reconciliation Engine*):**  
     Meskipun bukan nama modus risiko di rule engine, **seluruh logika penelaahan dan pencocokan bukti (*Evidence Review & Reconciliation*) telah diimplementasikan secara sangat matang dan menjadi inti dari MedCareJKN**:
     - **Kontrak Kanonikal Item & Bukti ([`shared/caseContract.js`](file:///D:/medcare/shared/caseContract.js#L4-L12)):**  
       Fungsi `itemContract()` mencocokkan setiap item tindakan klaim dengan dokumen bukti fisik pada tabel `evidence_links`.
     - **Empat Status Evaluasi Bukti Formal:**
       - **`SUPPORTED`:** Kuantitas bukti pendukung valid $\ge$ kuantitas tindakan klaim.
       - **`PARTIAL`:** Bukti pendukung valid mencakup sebagian kuantitas tindakan ($0 < \text{supported} < \text{claimed}$).
       - **`UNSUPPORTED`:** Bukti dicatat ada pada berkas pasien, namun tidak ada bukti pendukung yang cocok untuk item tindakan terkait ($\text{supported} = 0$).
       - **`UNAVAILABLE`:** Berkas bukti fisik tidak ditemukan sama sekali dalam arsip. Sesuai prinsip guardrail: `UNAVAILABLE` $\rightarrow$ `NO_CONCLUSION` (tidak boleh langsung dituduh fraud).
     - **Perhitungan Deterministik Selisih & Ketercakupan:**
       $$\text{evidenceGap} = \max(0, \text{claimedQuantity} - \text{supportedQuantity})$$
       $$\text{evidenceCoveragePct} = \min\left(100, \text{round}\left(\frac{\text{supportedQuantity}}{\max(1, \text{claimedQuantity})} \times 100\right)\right)$$
     - **Visualisasi Pada Antarmuka ([`frontend/src/pages/CaseDetailPage.jsx`](file:///D:/medcare/frontend/src/pages/CaseDetailPage.jsx#L900-L1080)):**  
       Menampilkan Card Metrik *Tingkat Pembuktian (% Terverifikasi)*, Card *Selisih Pembuktian (Gap Tindakan)*, Tabel Matriks Item Klaim vs Kuantitas Bukti Terverifikasi, Modal Unggah Bukti Tambahan (`uploadSupportingEvidence`), dan Seksi AI Copilot Rekomendasi Kelengkapan Bukti (`evidenceGapReport`).

---

## 6. KLASIFIKASI FITUR UNTUK REKOMENDASI PENYEDERHANAAN

Sesuai tujuan penyederhanaan produk agar berfokus pada **Phantom Billing**, **Upcoding**, dan **Evidence Review**, berikut klasifikasi komprehensif seluruh komponen:

### KELOMPOK A — FITUR UTAMA YANG HARUS DIPERTAHANKAN
Fitur yang secara langsung merepresentasikan tiga pilar fungsional produk:
1. **Pilar 1: Modul Deteksi & Penanganan Phantom Billing**  
   - Rule `PB-01` di `risk_rules.json`, deteksi kuantitas layanan fiktif tanpa dokumen tindakan, filter antrean `PHANTOM_BILLING`, dan kasus-kasus pendukung `CASE-PB-001`, `CASE-PB-002`, `CASE-PB-005`, `CASE-PB-007`, `CASE-PB-008`.
2. **Pilar 2: Modul Deteksi & Penanganan Upcoding**  
   - Rule `UC-01` di `risk_rules.json`, deteksi selisih tarif tagihan vs tarif pembanding INA-CBG (`tariffGap`), filter antrean `UPCODING`, dan kasus demo `CASE-PB-003`.
3. **Pilar 3: Sistem Rekonsiliasi & Penelaahan Bukti (Evidence Review Engine)**  
   - Logika komparasi item klaim vs bukti (`evidenceReconciliation.js`, `caseContract.js`), kalkulasi `SUPPORTED` / `PARTIAL` / `UNSUPPORTED` / `UNAVAILABLE`, formula `evidenceGap` & `evidenceCoveragePct`, tabel matriks bukti di `CaseDetailPage.jsx`, dan alur unggah bukti pendukung terverifikasi.

---

### KELOMPOK B — INFRASTRUKTUR PENDUKUNG YANG HARUS DIPERTAHANKAN
Fitur dan modul yang secara struktural dibutuhkan agar ketiga fitur utama di atas dapat beroperasi end-to-end:
1. **Autentikasi & Manajemen Sesi:** `backend/src/auth/session.js`, `authRoutes.js`, `LoginPage.jsx`. Menjamin integritas akses berbasis bearer token di tabel `auth_sessions`.
2. **Kontrol Akses Berbasis Peran (RBAC):** Pemisahan tegas wewenang Staff JKN (`staff_jkn`) dan Dokter Penelaah Klinis (`clinical_reviewer`).
3. **Dashboard Ringkasan Operasional:** `MedcareLanding.jsx`, `MedcareMinimalistDashboard.jsx`, `dashboardService.js`, `dashboardRoutes.js`. Menampilkan ringkasan metrik audit tiga fitur utama kepada verifikator.
4. **Antrean Pemeriksaan Kasus (Queue):** `CasesPage.jsx`, `caseService.js` (`getCases`). Menyediakan antrean kerja investigasi berkas klaim.
5. **Lembar Kerja Telaah Kasus (Detail Workspace):** `CaseDetailPage.jsx`, `caseService.js` (`getCaseById`). Ruang kerja interaktif untuk memeriksa fakta medis klaim.
6. **Alur Penugasan Dokter (Assignment):** `POST /api/cases/:caseId/assign`. Memungkinkan staf mengalokasikan kasus kepada dokter spesialis.
7. **Alur Keputusan Telaah Medis (Review Outcome):** `POST /api/cases/:caseId/outcome`. Memungkinkan dokter menetapkan putusan klinis (`CONFIRMED`, `NOT_CONFIRMED`, `NEEDS_MORE_EVIDENCE`, `FALSE_POSITIVE`).
8. **Alur Sanggahan & Rekonsiliasi Faskes (Dispute Trail):** `POST /api/cases/:caseId/dispute` dengan pengamanan **SEC-01**. Memungkinkan faskes mengajukan sanggahan resmi pasca-audit.
9. **Jejak Audit & Bukti Hukum (Audit Trail):** Tabel `audit_logs` dan `case_documents`. Menjamin setiap aksi memiliki bukti kepatuhan hukum yang tidak dapat disangkal (*non-repudiation*).
10. **Pusat Notifikasi Antar-Role:** `backend/src/services/notificationService.js`, `notificationRoutes.js`, icon lonceng di `MedcareHeader.jsx`. Menghubungkan komunikasi real-time antara Staff JKN dan DPJP.
11. **Formulir Audit Klaim Mandiri:** `ClaimAuditInputPage.jsx`, `claimRoutes.js` (`/audit-check`). Memungkinkan penguji menguji simulasi klaim individual secara langsung.

---

### KELOMPOK C — FITUR DI LUAR FOKUS YANG DIREKOMENDASIKAN UNTUK DINONAKTIFKAN
Modul-modul tambahan yang bersifat periferal, eksperimental, atau tidak relevan dengan 3 fokus utama:

| No | Modul / Komponen | Lokasi File | Alasan Rekomendasi Penonaktifan |
|---|---|---|---|
| 1 | **Modul Eksplorasi Data Makro BPJS 2025** | `frontend/src/pages/BpjsDataPage.jsx`, `backend/src/services/bpjsService.js`, `backend/src/routes/bpjsRoutes.js` | Merupakan portal penjelajah file sampel nasional (tabel, distribusi, download excel/zip). Tidak berhubungan dengan audit investigasi klaim individual tiga fitur utama. |
| 2 | **Modul Deteksi Anomali Tren Agregat Bulanan** | `frontend/src/components/common/BpjsAnomalyExplorer.jsx`, `backend/src/services/bpjsAnomalyService.js` | Menganalisis pola statistik makro bulanan faskes, bukan klaim individual. Menghasilkan kasus pola (`CASE-PAT`) yang memiliki alur berbeda dari klaim biasa. |
| 3 | **Modul Simulasi Audit Pasien SQLite** | `frontend/src/pages/BpjsAuditPage.jsx` (tab Pasien/Encounter), `backend/src/services/bpjsPatientService.js`, `backend/src/routes/bpjsPatientRoutes.js` | Menggunakan basis data SQLite paralel (`bpjs-patients.sqlite` dan `audit.sqlite`) yang terpisah dari basis data operasional utama PostgreSQL. Menimbulkan ambiguitas data demo. |
| 4 | **Modul Validasi Benchmark AI Sintetis** | `frontend/src/pages/ValidationPage.jsx`, `backend/src/services/validationService.js`, `backend/src/routes/validationRoutes.js` | Halaman pamer metrik ML (ROC-AUC curve, confusion matrix) yang dibangun dari file statis `validation_report.json`. Tidak digunakan dalam workflow operasional harian. |
| 5 | **Aturan Risiko di Luar 3 Fokus** | Aturan `UP-01` (`UNNECESSARY_PROCEDURES`), `DC-01` (`DUPLICATE_CLAIM`), `WD-01` (`WRONG_DIAGNOSIS`), `GE-01` (`GHOST_ENROLLEE`) pada `config/risk_rules.json` | Aturan-aturan ini membingungkan penguji yang ingin berfokus mengevaluasi Phantom Billing dan Upcoding. |
| 6 | **Kasus Pola Faskes Agregat (`CASE-PAT`)** | `frontend/src/components/common/PatternCaseView.jsx`, migrasi `20261029_002_patterns.sql` | Memiliki tampilan khusus tanpa item klaim dan tanpa rekonsiliasi bukti medis individual. |
| 7 | **Dead Code & Komponen Orphan** | `DashboardPage.jsx`, `Navbar.jsx`, `DoctorVideoCard.jsx`, `TeleConsultModal.jsx`, `VerificationDetailModal.jsx`, `AnimatedAlertModal.jsx`, seluruh file di `frontend/src/components/illustrations/` | File-file warisan yang tidak lagi diimpor atau dipanggil oleh antarmuka aplikasi aktif. |

---

## 7. KETERGANTUNGAN ANTARFITUR (DEPENDENCY GRAPH)

Diagram alur dependensi teknis kode untuk mempertahankan integritas ketiga fitur utama:

```mermaid
graph TD
    subgraph "Core Data & Infrastructure (Mandatory)"
        DB[("PostgreSQL jkn_integrity")]
        Auth["Auth & Session (session.js)"]
        RBAC["Role Guards (requireRole)"]
        Audit["Audit Logger (audit_logs)"]
        Notif["Notification Service"]
    end

    subgraph "Rule & Evidence Engines (Core Logic)"
        Rules["config/risk_rules.json (PB-01, UC-01)"]
        RE["shared/riskEngine.js (analyzeClaim)"]
        ER["evidenceReconciliation.js & caseContract.js"]
        Copilot["evidenceCopilot.js & evidence_requirements.json"]
    end

    subgraph "Primary Workflows"
        Queue["CasesPage.jsx (Filter PB & UC)"]
        Detail["CaseDetailPage.jsx"]
        EvTable["Tabel Rekonsiliasi Bukti Item Klaim"]
        EvUpload["Upload Bukti Tambahan & Re-Score"]
        Dispute["Sanggahan Faskes (SEC-01 Guarded)"]
        Outcome["Putusan Telaah Medis DPJP"]
    end

    DB --> Auth --> RBAC
    DB --> Audit
    DB --> Notif
    Rules --> RE
    RE --> Queue
    RE --> Detail
    ER --> EvTable
    ER --> Detail
    Copilot --> Detail
    Detail --> EvUpload
    Detail --> Dispute
    Detail --> Outcome
    Dispute --> Audit
    Dispute --> Notif
    Outcome --> Audit
    Outcome --> Notif
    EvUpload --> ER
    EvUpload --> RE
```

### Analisis Ketergantungan Kritis:
1. **Ketergantungan Evidence Review ke Phantom Billing:**  
   `PB-01` bergantung 100% pada hasil perbandingan kuantitas `itemContract()` dan `reconcileItem()`. Jika rekonsiliasi bukti dinonaktifkan, deteksi Phantom Billing akan kehilangan input `unsupportedQuantity`.
2. **Ketergantungan Upcoding ke Komparasi Tarif:**  
   `UC-01` bergantung pada field `tariffGap` (`total_amount - tariff_ina_cbg`). Logika ini mandiri dan tidak terpengaruh oleh ketiadaan data bukti fisik.
3. **Ketergantungan Sanggahan Faskes ke Penugasan Dokter:**  
   Ketika sanggahan diajukan oleh staf, status berpindah ke `RECONCILIATION`, dan dokter penelaah ditugaskan untuk menelaah ulang bukti sebelum menyimpan `review_outcome`.

---

## 8. RISIKO APABILA FITUR DI LUAR FOKUS DINONAKTIFKAN & MITIGASINYA

| Komponen yang Dinonaktifkan | Potensi Risiko Dampak | Tingkat Risiko | Mitigasi yang Direkomendasikan |
|---|---|---|---|
| **Menghapus Aturan Non-Target (`UP-01`, `DC-01`, dll.) dari `risk_rules.json`** | Skrip validasi `backend/src/services/validationService.js` memeriksa hash konfigurasi (`ruleConfigHash`). Jika `risk_rules.json` diubah, endpoint `/api/validation` melempar error 503. Test suite unit `backend/tests/decisionEngine.test.js` yang menguji rule non-target bisa gagal. | **Sedang** | Cukup sembunyikan dari dropdown filter `CasesPage.jsx` dan antarmuka UI tanpa menghapus definisi rule dari file JSON, ATAU sesuaikan test suite terkait saat pembersihan resmi dilakukan. |
| **Menonaktifkan Halaman Data BPJS (`#data-bpjs`) & Audit Pasien BPJS (`#audit-bpjs`)** | Menu navigasi di `MedcareHeader.jsx` dan tombol di landing page memiliki link ke halaman tersebut (`onOpenBpjs`, `onOpenInput`). Jika di-unmount tanpa membersihkan tombol navigasi, pengguna akan menemui layar kosong. | **Rendah** | Sembunyikan tombol tab *"Data BPJS"* dan *"Audit BPJS"* dari `MedcareHeader.jsx` serta sesuaikan state default routing di `App.jsx` agar langsung tertuju ke Dashboard (`landing`) dan Antrean Kasus (`cases`). |
| **Menonaktifkan Kasus Pola Agregat (`CASE-PAT`)** | Jika filter antrean tidak diselaraskan, kasus pola yang ada di database demo tetap muncul di tabel antrean kasus. | **Rendah** | Tambahkan klausa filter default di `caseService.js` untuk mengecualikan `case_type = 'pattern'`, sehingga hanya menampilkan kasus klaim individual. |
| **Menghapus File Dead Code (`DashboardPage.jsx`, `Navbar.jsx`, dll.)** | Tidak ada risiko. File-file tersebut sama sekali tidak diimpor dalam rantai kompilasi bundler Vite (`vite.config.js`). | **Nol (Aman)** | Dapat dihapus dengan aman untuk merapikan struktur direktori proyek. |

---

## 9. REKOMENDASI IMPLEMENTASI PENYEDERHANAAN (ACTION PLAN TAHAP BERIKUTNYA)

Jika tim pengujian memutuskan untuk merealisasikan penyederhanaan produk pada tahap berikutnya, berikut **rekomendasi perubahan minimum dan terukur**:

```mermaid
graph TD
    Step1["Tahap 1: Penyederhanaan Navigasi Header & Routing"]
    Step2["Tahap 2: Fokus Filter Antrean Kasus (PB, UC, All)"]
    Step3["Tahap 3: Formalisasi Kategori EVIDENCE_REVIEW di Rule Engine"]
    Step4["Tahap 4: Pembersihan Dead Code & Orphan Components"]

    Step1 --> Step2 --> Step3 --> Step4
```

1. **Tahap 1: Penyederhanaan Navigasi UI (`MedcareHeader.jsx` & `App.jsx`):**
   - Sembunyikan tab navigasi *"Data BPJS"* dan *"Audit BPJS"*.
   - Pertahankan 4 menu utama yang bersih: **Beranda (Dashboard)**, **Antrean Kasus Klaim**, **Formulir Uji Klaim Manual**, dan **Panduan**.
2. **Tahap 2: Fokus Filter Mode Risiko Antrean (`CasesPage.jsx`):**
   - Sederhanakan dropdown filter mode risiko hanya menampilkan 4 pilihan:
     - `Semua Mode Risiko`
     - `Indikasi Phantom Billing`
     - `Indikasi Upcoding`
     - `Kesenjangan Bukti Layanan (Evidence Review)`
3. **Tahap 3: Formalisasi Modus `EVIDENCE_REVIEW` Pada Rule Engine:**
   - Tambahkan aturan formal `ER-01` di `config/risk_rules.json` dengan label *"Kesenjangan kuantitas bukti layanan medis (Partial Support)"* yang aktif ketika bukti berstatus `PARTIAL`, sehingga ketiga fitur target terintegrasi secara setara di Rule Engine.
4. **Tahap 4: Pembersihan Dead Code:**
   - Hapus file-file orphan yang tidak terpakai (`DashboardPage.jsx`, `Navbar.jsx`, modal dan ilustrasi mati) guna mengurangi ukuran repositori dan beban kognitif pengembang.

---

## 10. KESIMPULAN AUDIT AKHIR

1. **Apakah ketiga fitur target benar-benar tersedia?**
   - **Phantom Billing:** **YA, 100% TERSEDIA & LENGKAP** (Aturan `PB-01`, 14 kasus pendukung di database, visualisasi, dan alur kerja end-to-end aktif).
   - **Upcoding:** **YA, 100% TERSEDIA SECARA STRUKTURAL** (Aturan `UC-01`, kasus demo `CASE-PB-003`, visualisasi disparitas tarif, dan telaah DPJP aktif).
   - **Evidence Review:** **YA, TERSEDIA PENUH SEBAGAI SISTEM REKONSILIASI BUKTI MEDIS KLAIM** (`reconcileItem`, `itemContract`, status `SUPPORTED`/`PARTIAL`/`UNSUPPORTED`/`UNAVAILABLE`, kalkulasi `evidenceGap` & `coveragePct`, matriks bukti di `CaseDetailPage.jsx`). Namun, belum dijadikan nama rule mandiri di `risk_rules.json` (hanya ada sebagai label seed dataset).
2. **Apakah ketiganya dapat berjalan end-to-end?**  
   **YA.** Ketiga fitur dapat diakses melalui antrean kasus, dibuka di lembar kerja telaah detail, ditelaah item demi item, dilengkapi dengan unggahan bukti pendukung, disanggah oleh faskes melalui alur resmi SEC-01, dan diputuskan oleh Dokter Penelaah Klinis secara sah.
3. **Apakah ada fitur yang aman dinonaktifkan?**  
   **YA.** Modul penjelajah data makro BPJS 2025, modul audit pasien SQLite terpisah, modul visualisasi benchmark AI sintetis, analisis tren bulanan agregat, dan seluruh komponen *dead code* aman dinonaktifkan tanpa merusak ketiga fitur utama.
4. **Kondisi Lingkungan Saat Ini:**  
   Pemeriksaan telah diselesaikan secara **100% READ-ONLY**. Tidak ada file source code, konfigurasi, migrasi, seed, atau data kasus di PostgreSQL yang diubah. Basis data demo operasional `jkn_integrity` tetap 100% utuh.

