# LAPORAN PENGUJIAN UAT, VERIFIKASI TEST, DAN PENYELESAIAN BUG MEDCAREJKN

Dokumen ini mencatat seluruh temuan anomali, kegagalan fungsional (*bugs*), analisis akar masalah (*root cause*), tindakan perbaikan (*remediation*), serta hasil verifikasi pengujian otomatis, browser testing, dan integritas basis data pada aplikasi **medCareJKN** per **30 Oktober 2026**.

---

## 1. REKAPITULASI HASIL PENGUJIAN SISTEM OTOMATIS & VERIFIKASI RUNTIME

### A. Pengujian Backend Regresi (`backend/tests/`)
- **Perintah Eksekusi:**
  ```powershell
  npm test --prefix backend
  ```
- **Exit Code:** `0` (Sukses Penuh)
- **Rincian Hasil Test:**
  - Total Tes Dijalankan: **24 test**
  - Lulus (*Passed*): **24 test**
  - Gagal (*Failed*): **0 test**
  - Dibatalkan / Dilewati (*Skipped/Cancelled*): **0 test**
  - Durasi Pengujian: ~3.51 detik
- **Catatan Dependensi & Isolasi:** Pengujian modul migrasi (`stability.integration.test.js`) dan modul pengujian otorisasi sanggahan (`security.dispute.test.js`) berjalan pada database uji terisolasi dinamis (`jkn_sec01_test_<timestamp>` dan `jkn_prd_test_<timestamp>`) tanpa menyentuh atau memutasi database demo operasional `jkn_integrity`.

### B. Pengujian Kompilasi & Build Frontend (`frontend/`)
- **Perintah Eksekusi:**
  ```powershell
  npm run build --prefix frontend
  ```
- **Exit Code:** `0` (Sukses Penuh)
- **Hasil:** Mentransformasi 2.319 modul React/JSX menjadi bundel produksi teroptimasi Vite (`dist/assets/`) dalam waktu 3.94 detik tanpa galat sintaks maupun peringatan pemaketan.

### C. Pengujian Browser End-to-End dengan Playwright (`scratch/playwright_audit.py`)
- **Metodologi:** Pengujian browser Chromium terotomasi tanpa headless (`headless=True`) mengeksekusi 21 langkah interaktif lengkap meliputi Login Staff & Dokter, Header 4-menu, Antrean Kasus FOCUS (termasuk UNAVAILABLE), 4 Mode Uji Klaim Manual, Pengunggahan Bukti, Putusan Review Outcome, dan Navigasi Mobile Viewport (375x812).
- **Hasil:**
  - Total Skenario Diuji: **21 langkah pengujian**
  - Lulus (*Passed*): **21 (100%)**
  - Browser Console Errors: **0 console error**
  - Page Errors: **0 page error**
  - HTTP Network Failures: **0 failure**
  - Horizontal Viewport Overflow: **0 px** (lebar konten persis 375px).

### D. Verifikasi Integritas Basis Data Operasional (`jkn_integrity`)
- Total Baris Kasus (`cases`): **Tepat 37 kasus** (konsisten)
- Total Baris Butir Klaim (`claims`): **Tepat 49 klaim** (konsisten)
- Total Log Audit (`audit_logs`): **Tepat 26 baris** (konsisten)
- Timestamp Rekaman Terbaru: `2026-10-29T17:49:48.338Z` (tidak berubah)
- Total Mutasi Data pada `jkn_integrity`: **0 mutasi (100% terjaga utuh)**.

---

## 2. MATRIKS STATUS & KLASIFIKASI BUG UAT

| ID Bug | Modul Terkait | Tingkat Keparahan | Status Verifikasi | Ringkasan Masalah |
|---|---|---|---|---|
| **BUG-01** | Dashboard (`MedcarePriorityAuditCard.jsx`) | Minor | **Passed (Runtime Verified)** | Kontras teks rendah pada kartu Rencana Audit Prioritas. |
| **BUG-02** | Detail Kasus (`caseService.js` / Form Bukti) | Major | **Passed (Runtime Verified)** | Dokumen bukti pendukung tidak tersimpan ke database & cakupan bukti tidak bertambah. |
| **BUG-03** | Rekonsiliasi (`caseService.js` / Form Dispute) | Major | **Passed (Runtime Verified)** | Pengajuan sanggahan faskes tidak mencatat lampiran & status tidak berubah. |
| **BUG-04** | Telaah Dokter (`caseController.js` / Outcome) | Critical | **Passed (Runtime Verified)** | Dokter penelaah gagal menyimpan keputusan klinis dan catatan telaah medis. |
| **BUG-05** | Notifikasi (`notifications.js` / Backend API) | Critical | **Passed (Runtime Verified)** | Notifikasi hanya tersimpan di `localStorage`, tidak tersimpan di PostgreSQL & tidak lintas peran. |
| **BUG-06** | Migrasi Database (`20261030_001_notifications.sql`) | Major | **Passed (Runtime Verified)** | Pelanggaran Foreign Key constraint saat inisialisasi basis data dari nol pada pengujian integrasi. |
| **SEC-01** | Otorisasi Dispute (`caseRoutes.js` / `caseService.js`) | Medium | **Passed (Resolved & Verified)** | Ketiadaan role-based authorization pada endpoint dispute yang memungkinkan role selain staff mengakses alur sanggahan. |
| **BUG-07** | Antrean Kasus Mock (`frontend/src/api/client.js`) | Minor | **Passed (Resolved & Verified)** | Filter fallback mock `riskMode === 'FOCUS'` mengabaikan array 3 fokus sehingga mengembalikan daftar kosong pada mode demo. |
| **BUG-08** | Inkonsistensi Demo Dataset (`data/demo/cases.json`) | Minor | **Passed (Resolved & Verified)** | Kasus `CASE-PB-008` tercatat sebagai `PHANTOM_BILLING`/`HIGH`, tidak selaras dengan PostgreSQL yang mencatat `UNAVAILABLE`/`NO_CONCLUSION`. |
| **BUG-09** | Engine Bersama (`shared/riskEngine.js`) | Medium | **Passed (Resolved & Verified)** | `tariffGap` tidak dihitung otomatis jika parameter `tariffGap` tidak disediakan langsung pada objek input klaim. |
| **BUG-10** | Pemblokiran Modul Non-Fokus (`backend/src/server.js`) | Major | **Passed (Resolved & Verified)** | Endpoint legacy `/api/bpjs/*`, `/api/validation/*`, `/api/analysis/*` harus diblokir dengan HTTP 403 `FORBIDDEN_LEGACY_MODULE` pada lingkungan operasional 3 fokus. |

---

## 3. RINCIAN AKAR MASALAH & PENYELESAIAN SETIAP BUG

---

### BUG-01: Kontras Teks Rendah pada Kartu Rencana Audit Prioritas
- **Gejala & Dampak:** Teks judul dan ringkasan risiko pada kartu audit prioritas di dashboard menggunakan warna abu-abu muda di atas latar belakang terang, menyulitkan pengguna membaca detail kasus.
- **Akar Masalah:** Deklarasi warna inline CSS menggunakan kode hex `#94a3b8` tanpa kontras yang cukup terhadap background kartu putih/terang.
- **Tindakan Perbaikan:** Mengubah warna teks judul menjadi abu-abu gelap pekat (`#0f172a`), teks ringkasan menjadi netral (`#334155`), dan mempertegas warna lencana risiko (`#991b1b`).
- **Hasil Verifikasi:** Lulus verifikasi visual peramban dengan keterbacaan tinggi.

---

### BUG-02: Kegagalan Unggah Bukti Pendukung Rekam Medis
- **Gejala & Dampak:** Dokumen tidak terhubung ke tabel `evidence_links`, berkas fisik tidak terarsip, dan nilai *Evidence Coverage Pct* tidak berubah.
- **Akar Masalah:** Handler `recordCaseAction('evidence')` di `caseService.js` tidak memasukkan record ke tabel `evidence_links` dan tidak memicu rekalkulasi metrik risiko.
- **Tindakan Perbaikan:** Menambahkan pencatatan `evidence_links`, mengarsipkan file fisik dengan batas 10 MB, dan memicu kalkulasi ulang `evidence_coverage_pct` dan `evidence_gap`.
- **Hasil Verifikasi:** File tersimpan di disk, baris `evidence_links` bertambah, dan metrik cakupan bukti terhitung ulang dengan benar.

---

### BUG-03: Pengajuan Sanggahan Faskes Gagal Menyimpan Lampiran
- **Gejala & Dampak:** Sanggahan faskes tidak menyimpan surat lampiran dan status kasus tidak bertransisi ke `RECONCILIATION`.
- **Akar Masalah:** Handler `recordCaseAction('dispute')` tidak mengeksekusi mutasi SQL pada kolom `case_status`.
- **Tindakan Perbaikan:** Menyempurnakan penyimpanan dokumen ke `case_documents` jenis `dispute` dan mengeksekusi update status ke `RECONCILIATION`.
- **Hasil Verifikasi:** Dokumen sanggahan tercatat di linimasa sengketa dan status kasus termutasi menjadi `RECONCILIATION`.

---

### BUG-04: Kegagalan Menyimpan Putusan Telaah Klinis Dokter
- **Gejala & Dampak:** Dokter penelaah mengalami penolakan (HTTP 400/500) saat menyimpan keputusan klinis.
- **Akar Masalah:** `submitCaseOutcome` tidak menyelaraskan ID reviewer dari token JWT aktif (`req.user.username`).
- **Tindakan Perbaikan:** Mengamankan route dengan `requireRole('clinical_reviewer')`, mencatat putusan ke `review_outcomes`, dan memperbarui status kasus di tabel `cases`.
- **Hasil Verifikasi:** HTTP 200 OK, data tersimpan di `review_outcomes`, dan notifikasi balik terbit ke staf.

---

### BUG-05: Ketiadaan Persistensi dan Komunikasi Notifikasi Antar-Peran
- **Gejala & Dampak:** Notifikasi hanya tersimpan di `localStorage` peramban lokal dan hilang saat pembersihan cache.
- **Akar Masalah:** Ketiadaan tabel PostgreSQL `notifications` dan tidak adanya event trigger di backend.
- **Tindakan Perbaikan:** Membuat tabel `notifications`, mengimplementasikan `notificationService.js`, membuat event triggers di `caseService.js`, serta mengintegrasikan navbar dengan polling 15s dan fetch on-demand saat lonceng diklik.
- **Hasil Verifikasi:** Notifikasi tersimpan secara sinkron di database dan terkirim akurat antar-role.

---

### BUG-06: Pelanggaran Foreign Key Constraint Saat Inisialisasi Database Bersih
- **Gejala & Dampak:** Integrasi tes otomatis gagal dengan error Foreign Key constraint saat inisialisasi basis data baru.
- **Akar Masalah:** Migrasi `20261030_001_notifications.sql` menyisipkan seed data sebelum tabel `cases` terisi.
- **Tindakan Perbaikan:** Menambahkan klausul `WHERE EXISTS (SELECT 1 FROM cases WHERE case_id = ...)` dan memindahkan eksekusi seed notifikasi di `migrate.js`.
- **Hasil Verifikasi:** Seluruh tes backend lulus 100% dan migrasi bersifat idempoten.

---

### SEC-01: Ketiadaan Pembatasan Role pada Endpoint Sanggahan Faskes (`POST /api/cases/:id/dispute`)
- **Tingkat Keparahan:** Medium / Authorization Vulnerability
- **Status:** **RESOLVED & VERIFIED (Telah Diperbaiki & Diuji Otomatis)**
- **Akar Masalah Awal:** Endpoint `POST /api/cases/:caseId/dispute` hanya dilindungi `requireSession` tanpa pembatasan role. Akun selain Staff JKN berpotensi mengirimkan sanggahan dan memanfaatkan `allowRevision: true` untuk membuka kembali kasus final.
- **Tindakan Remediasi yang Diterapkan:**
  1. Menambahkan guard `requireRole('staff_jkn')` pada route Express.
  2. Menambahkan pertahanan berlapis di tingkat service (`caseService.js`): memvalidasi `actor?.role === 'staff_jkn'` sebelum evaluasi status kasus.
  3. Mengunci parameter `allowRevision` secara eksklusif menggunakan **validasi literal boolean ketat** (`payload?.allowRevision === true`). String `"true"`, angka `1`, atau objek `{}` ditolak tegas dengan HTTP 409 Conflict.
- **Hasil Verifikasi:** Seluruh 9 skenario keamanan diverifikasi lulus 100% pada suite pengujian otomatis `security.dispute.test.js` dan isolated E2E workflow test.

---

### BUG-07: Visibilitas Kasus UNAVAILABLE dalam Antrean Mode FOCUS di UI Mock/Demo Frontend
- **Gejala & Dampak:** Saat antarmuka dijalankan dalam mode demo (`VITE_USE_MOCK=true` atau fallback mock), memilih filter mode risiko `FOCUS` menghasilkan antrean kosong (0 baris), meskipun terdapat kasus `UNAVAILABLE`, `PHANTOM_BILLING`, dan `UPCODING`.
- **Akar Masalah:** Pada `frontend/src/api/client.js`, fungsi penyaring mock `filtered()` hanya membandingkan kecocokan string persis `c.primary_risk_mode === params.riskMode`. Karena tidak ada kasus yang bernilai `'FOCUS'` secara harfiah, seluruh kasus tereliminasi.
- **Tindakan Perbaikan:** Menambahkan percabangan logika pada baris 12 [frontend/src/api/client.js](file:///D:/medcare/frontend/src/api/client.js#L12):
  ```javascript
  if (params.riskMode === 'FOCUS') {
    return ['PHANTOM_BILLING', 'UPCODING', 'EVIDENCE_REVIEW', 'UNAVAILABLE'].includes(c.primary_risk_mode);
  }
  ```
- **Hasil Verifikasi:** Kasus dengan modus `PHANTOM_BILLING`, `UPCODING`, `EVIDENCE_REVIEW`, dan `UNAVAILABLE` tampil dengan benar pada filter antrean `FOCUS`, sementara kasus `PATTERN_REVIEW` secara tepat disaring keluar.

---

### BUG-08: Inkonsistensi Data Demo Kasus `CASE-PB-008` antara `cases.json` dan Database PostgreSQL
- **Gejala & Dampak:** Pada basis data PostgreSQL `jkn_integrity`, kasus `CASE-PB-008` telah diperbaiki menjadi skenario `primary_risk_mode = 'UNAVAILABLE'` dan `review_priority = 'NO_CONCLUSION'`. Namun pada file mock `data/demo/cases.json`, baris tersebut masih bertuliskan `primary_risk_mode: "PHANTOM_BILLING"` dan `review_priority: "HIGH"`. Inkonsistensi ini menyebabkan perbedaan perilaku antara mode live backend dan demo frontend.
- **Akar Masalah:** File statis `data/demo/cases.json` belum disinkronkan pasca perbaikan database pada Task 3.
- **Tindakan Perbaikan:** Memperbarui baris 707-708 [data/demo/cases.json](file:///D:/medcare/data/demo/cases.json#L707-L708) menjadi:
  ```json
  "primary_risk_mode": "UNAVAILABLE",
  "review_priority": "NO_CONCLUSION",
  ```
- **Hasil Verifikasi:** Data demo JSON dan database PostgreSQL kini 100% identik dan konsisten.

---

### BUG-09: Ketiadaan Komputasi Otomatis `tariffGap` pada Modul Engine Bersama (`shared/riskEngine.js`)
- **Gejala & Dampak:** Saat pengguna menjalankan kalkulasi penapisan risiko pada Uji Klaim Manual menggunakan mode Upcoding, jika pengguna hanya mengisi `amountBilled` (misal Rp15.600.000) dan `referenceTariff` (misal Rp6.000.000) namun membiarkan input selisih kosong/tidak terkirim, aturan `UC-01` tidak terpicu karena `tariffGap` tetap bernilai `undefined`.
- **Akar Masalah:** Pada fungsi `analyzeClaim` di [shared/riskEngine.js](file:///D:/medcare/shared/riskEngine.js#L7), variabel normalisasi `f.tariffGap` tidak menghitung selisih matematis dari `amountBilled` dan `referenceTariff` jika parameter `tariffGap` tidak secara eksplisit disediakan.
- **Tindakan Perbaikan:** Menambahkan kalkulasi turunan otomatis pada baris 7-8 [shared/riskEngine.js](file:///D:/medcare/shared/riskEngine.js#L7-L8):
  ```javascript
  f.tariffGap = available(f.tariffGap)
    ? Number(f.tariffGap)
    : (available(f.amountBilled) && available(f.referenceTariff) && f.referenceTariff !== ''
        ? Math.max(0, Number(f.amountBilled) - Number(f.referenceTariff))
        : null);
  ```
- **Hasil Verifikasi:** Pengujian Playwright membuktikan aturan `UC-01` terpicu dengan sempurna (skor 35, selisih gap Rp9.600.000,- terdeteksi) baik di live backend Express maupun frontend engine fallback.

---

### BUG-10: Pemblokiran Akses Endpoint Modul Non-Fokus Legacy pada Lingkungan Operasional
- **Gejala & Dampak:** Rute API lama non-target (`/api/bpjs/*`, `/api/validation/*`, `/api/analysis/*`) berpotensi dieksekusi secara liar di luar cakupan 3 fokus utama.
- **Akar Masalah:** Modul lama masih terdaftar pada Express router tanpa middleware penolakan terpusat.
- **Tindakan Perbaikan:** Memasang middleware `blockLegacy` pada [backend/src/server.js](file:///D:/medcare/backend/src/server.js) yang memblokir akses ke rute `/api/bpjs`, `/api/validation`, dan `/api/analysis` dengan status HTTP 403 dan kode error `FORBIDDEN_LEGACY_MODULE`.
- **Hasil Verifikasi:** Pengujian runtime membuktikan seluruh rute warisan non-fokus ditolak secara konsisten dengan HTTP 403 Forbidden.
