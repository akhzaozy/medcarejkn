# LAPORAN PENGUJIAN UAT, VERIFIKASI TEST, DAN PENYELESAIAN BUG MEDCAREJKN

Dokumen ini mencatat seluruh temuan anomali, kegagalan fungsional (*bugs*), analisis akar masalah (*root cause*), tindakan perbaikan (*remediation*), serta hasil verifikasi pengujian otomatis dan manual pada aplikasi **medCareJKN**.

---

## 1. REKAPITULASI HASIL PENGUJIAN SISTEM OTOMATIS

### A. Pengujian Backend (`backend/tests/`)
- **Perintah Eksekusi:**
  ```powershell
  $env:Path = "D:\tools\pgsql\bin;" + $env:Path; Set-Location "D:\medcare\backend"; npm test
  ```
- **Exit Code:** `0` (Sukses Penuh)
- **Rincian Hasil Test:**
  - Total Tes Dijalankan: **24 test** (termasuk suite regresi keamanan SEC-01)
  - Lulus (*Passed*): **24 test**
  - Gagal (*Failed*): **0 test**
  - Dibatalkan / Dilewati (*Skipped/Cancelled*): **0 test**
  - Durasi Pengujian: ~6.02 detik
- **Catatan Dependensi Lingkungan:** Pengujian otomatis modul migrasi (`stability.integration.test.js`) dan modul pengujian otorisasi sanggahan (`security.dispute.test.js`) menggunakan koneksi PostgreSQL lokal (`127.0.0.1:5432`) dengan membuat database uji terisolasi dinamis (`jkn_sec01_test_<timestamp>` dan `jkn_prd_test_<timestamp>`) tanpa menyentuh atau memutasi database demo `jkn_integrity`. Direktori binary PostgreSQL (`D:\tools\pgsql\bin`) wajib disertakan dalam variabel lingkungan `PATH`.

### B. Pengujian Kompilasi & Build Frontend (`frontend/`)
- **Perintah Eksekusi:**
  ```powershell
  Set-Location "D:\medcare\frontend"; npm run build
  ```
- **Exit Code:** `0` (Sukses Penuh)
- **Hasil:** Mentransformasi 2.319 modul React/JSX menjadi aset produksi siap saji dalam waktu 44,86 detik tanpa galat sintaks maupun peringatan pemaketan.

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

---

## 3. RINCIAN AKAR MASALAH & PENYELESAIAN SETIAP BUG

---

### BUG-01: Kontras Teks Rendah pada Kartu Rencana Audit Prioritas

- **Gejala & Dampak:** Teks judul dan ringkasan risiko pada kartu audit prioritas di dashboard menggunakan warna abu-abu muda di atas latar belakang terang, menyulitkan pengguna membaca detail kasus.
- **Akar Masalah:** Deklarasi warna inline CSS menggunakan kode hex `#94a3b8` tanpa kontras yang cukup terhadap background kartu putih/terang.
- **Tindakan Perbaikan:**
  - Mengubah warna teks judul menjadi abu-abu gelap pekat (`#0f172a`).
  - Mengubah teks ringkasan menjadi abu-abu netral (`#334155`).
  - Mempertegas warna lencana risiko (`#991b1b` di atas latar merah lembut).
- **Hasil Verifikasi:** Teks terbaca dengan sangat jelas pada seluruh ukuran resolusi layar.

---

### BUG-02: Kegagalan Unggah Bukti Pendukung Rekam Medis

- **Gejala & Dampak:** Ketika formulir unggah bukti pada Seksi 6 diisi dan diserahkan, dokumen tidak terhubung ke tabel `evidence_links`, berkas fisik tidak terarsip, dan nilai *Evidence Coverage Pct* tidak berubah.
- **Akar Masalah:** Handler `recordCaseAction('evidence')` di `caseService.js` tidak memasukkan record ke tabel `evidence_links` secara terstruktur dan tidak memicu kalkulasi ulang skor risiko dan cakupan bukti pada tabel `cases`.
- **Tindakan Perbaikan:**
  - Memperbaiki pencatatan `evidence_links` dengan status `MATCHED` (bila terverifikasi) atau `PENDING`.
  - Mengarsipkan file fisik ke direktori `outputs/runtime-auth/uploads/` dengan batas ukuran 10 MB dan validasi ekstensi (`.pdf`, `.jpg`, `.jpeg`, `.png`, `.dcm`).
  - Memicu kalkulasi ulang fungsi `analyzeClaim` untuk memperbarui `evidence_coverage_pct` dan `evidence_gap` secara otomatis pada tabel `cases`.
- **Hasil Verifikasi:** Pengujian runtime membuktikan dokumen tersimpan, link bukti muncul di tabel, dan cakupan bukti bertambah sesuai kuantitas tindakan yang didukung.

---

### BUG-03: Pengajuan Sanggahan Faskes Gagal Menyimpan Lampiran

- **Gejala & Dampak:** Formulir sanggahan faskes pada Seksi 7B tidak menyimpan dokumen surat lampiran rumah sakit dan status klaim tidak bertransisi ke `RECONCILIATION`.
- **Akar Masalah:** Handler `recordCaseAction('dispute')` tidak memvalidasi format array lampiran dan tidak mengeksekusi perintah SQL untuk memperbarui kolom `case_status`.
- **Tindakan Perbaikan:**
  - Menyempurnakan penyimpanan dokumen sanggahan ke tabel `case_documents` dengan jenis `dispute`.
  - Mengeksekusi mutasi status: `UPDATE cases SET case_status = 'RECONCILIATION' WHERE case_id = $1`.
  - Menerbitkan notifikasi persisten otomatis ke tim verifikator JKN dan dokter penelaah kasus tersebut.
- **Hasil Verifikasi:** Sanggahan berhasil tercatat di linimasa sengketa, file lampiran dapat diakses, dan status kasus berhasil dimutasi menjadi `RECONCILIATION` di database.

---

### BUG-04: Kegagalan Menyimpan Putusan Telaah Klinis Dokter

- **Gejala & Dampak:** Dokter penelaah yang menekan tombol *"Simpan Keputusan Telaah"* mengalami penolakan (HTTP 400/500), sehingga hasil telaah tidak tersimpan ke basis data.
- **Akar Masalah:**
  1. Kontroler backend mengecek hak akses tetapi terdapat inkonsistensi parameter otorisasi pada route.
  2. Fungsi `submitCaseOutcome` tidak menyelaraskan ID reviewer dari sesi token JWT aktif (`req.user.username`).
- **Tindakan Perbaikan:**
  - Mengamankan route `POST /api/cases/:caseId/outcome` secara ketat dengan middleware `requireRole('clinical_reviewer')`.
  - Menyimpan keputusan ke tabel `review_outcomes` dengan kolom `reviewer_id` yang terisi username dokter aktif, status outcome (`CONFIRMED`, `NOT_CONFIRMED`, `NEEDS_MORE_EVIDENCE`, `FALSE_POSITIVE`), serta catatan pertimbangan medis DPJP.
  - Memperbarui status kasus pada tabel `cases` secara sinkron.
- **Hasil Verifikasi:** Pengujian panggilan API runtime menghasilkan HTTP 200 OK, record tersimpan di `review_outcomes`, dan status kasus berubah menjadi `CONFIRMED` atau `NOT_CONFIRMED`.

---

### BUG-05: Ketiadaan Persistensi dan Komunikasi Notifikasi Antar-Peran

- **Gejala & Dampak:** Lonceng notifikasi hanya membaca array mock statis di `localStorage`. Ketika staf menugaskan kasus, lonceng dokter tidak bereaksi; saat dokter memutus telaah, staf tidak memperoleh pemberitahuan.
- **Akar Masalah:** Ketiadaan tabel basis data, tidak tersedianya rute API notifikasi di backend, dan tidak ada pemicu (*event trigger*) saat mutasi berkas terjadi.
- **Tindakan Perbaikan:**
  - Membuat tabel `notifications` di PostgreSQL dengan indeks pencarian pada `(recipient_username, read, created_at DESC)` dan `(recipient_role, read, created_at DESC)`.
  - Mengembangkan service `notificationService.js`, controller `notificationController.js`, dan endpoint REST `/api/notifications`.
  - Memasang pemicu otomatis di `caseService.js` pada 5 aksi: penugasan dokter, penyelesaian telaah klinis, pencatatan sanggahan, penambahan bukti, dan permintaan klarifikasi.
  - Mengintegrasikan frontend navbar dengan polling berkala per 15 detik dan on-demand refresh saat ikon lonceng diklik.
- **Hasil Verifikasi:** Pengujian end-to-end membuktikan: record notifikasi tersimpan secara sinkron di basis data PostgreSQL saat aksi mutasi dieksekusi. Pada antarmuka peramban, notifikasi dimuat melalui mekanisme polling berkala 15 detik atau langsung saat ikon lonceng diklik (*on-demand refresh*). Saat staf menugaskan kasus `CASE-0009` ke `dr.anindya`, notifikasi tercatat dan tampil pada antrean dokter. Begitu pula saat dokter menyelesaikan telaah, notifikasi hasil telaah klinis `[NOT_CONFIRMED]` tercatat di basis data dan berhasil diterima oleh akun staf.

---

### BUG-06: Pelanggaran Foreign Key Constraint Saat Inisialisasi Database Bersih

- **Gejala & Dampak:** Rangkaian tes integrasi otomatis (`stability.integration.test.js`) gagal dengan error `insert or update on table "notifications" violates foreign key constraint "notifications_case_id_fkey"` ketika menjalankan migrasi pada basis data uji yang baru dibuat.
- **Akar Masalah:** File migrasi `20261030_001_notifications.sql` menyisipkan baris seed notifikasi yang mereferensikan `CASE-PB-001` sebelum data kasus diisikan oleh skrip `migrate.js`.
- **Tindakan Perbaikan:**
  - Menambahkan klausul pengaman `WHERE EXISTS (SELECT 1 FROM cases WHERE case_id = ...)` pada file migrasi SQL.
  - Memindahkan pemanggilan penyisipan data seed notifikasi di dalam `migrate.js` tepat setelah perulangan seed kasus selesai dijalankan.
- **Hasil Verifikasi:** Seluruh 23 tes backend kini lulus 100%, migrasi bersifat idempoten (*status: 'migrated'* lalu *'current'*), dan database terlindungi tanpa eror integritas relasional.

---

## 4. TEMUAN AUDIT KEAMANAN (SECURITY FINDINGS) & REMEDIASI

Audit keamanan mendalam terhadap kode otorisasi dan penanganannya pada aplikasi MedCareJKN:

### SEC-01: Ketiadaan Pembatasan Role pada Endpoint Sanggahan Faskes (`POST /api/cases/:id/dispute`)
- **Tingkat Keparahan:** Medium / Authorization Vulnerability
- **Status:** **RESOLVED & VERIFIED (Telah Diperbaiki & Diuji Otomatis)**
- **Akar Masalah Awal:**
  Pada `backend/src/routes/caseRoutes.js`, route dispute hanya menerapkan `requireSession` tanpa `requireRole('staff_jkn')`. Method `recordCaseAction('dispute')` di `caseService.js` juga tidak memvalidasi role aktor pemanggil. Selain itu, parameter `allowRevision: true` pada implementasi lama bersifat umum sehingga berpotensi meloloskan guard status final pada action lain seperti `evidence`. Akibatnya, pengguna dengan sesi `clinical_reviewer` dapat menembak endpoint langsung dan menyertakan `allowRevision: true` untuk memodifikasi atau membuka kembali kasus final.
- **Tindakan Remediasi yang Diterapkan:**
  1. **Route-Level Guard:** Pada [backend/src/routes/caseRoutes.js](file:///D:/medcare/backend/src/routes/caseRoutes.js#L18), menambahkan `'dispute'` ke daftar peran yang mewajibkan `requireRole('staff_jkn')`:
     ```javascript
     const guard = ['ownership', 'clarification', 'schedule', 'dispute'].includes(action)
       ? requireRole('staff_jkn')
       : action === 'feedback'
       ? requireRole('clinical_reviewer')
       : (req, res, next) => next();
     ```
  2. **Service-Level Guard (*Defense in Depth*):** Pada [backend/src/services/caseService.js](file:///D:/medcare/backend/src/services/caseService.js#L368), menambahkan pemeriksaan eksplisit kewenangan role sebelum evaluasi status final dan `allowRevision`:
     ```javascript
     if (kind === 'dispute' && actor?.role !== 'staff_jkn') {
       const e = new Error('Peran Anda tidak berwenang melakukan tindakan ini.');
       e.statusCode = 403;
       throw e;
     }
     ```
  3. **Penguncian Ketat Aturan `allowRevision` (Strict Boolean Validation):** Pada [backend/src/services/caseService.js](file:///D:/medcare/backend/src/services/caseService.js#L369), parameter `allowRevision` divalidasi secara ketat hanya menerima literal boolean `true` (`payload?.allowRevision === true`) dan dikunci secara eksklusif HANYA untuk `kind === 'dispute'` oleh aktor dengan peran `staff_jkn`:
     ```javascript
     const isAllowedDisputeRevision = kind === 'dispute' && actor?.role === 'staff_jkn' && payload?.allowRevision === true;
     if (['CONFIRMED', 'NOT_CONFIRMED', 'CLOSED'].includes(row.case_status) && !['feedback', 'copilot'].includes(kind) && !isAllowedDisputeRevision) {
       const e = new Error('Kasus sudah diputuskan; bukti baru memerlukan peninjauan ulang terpisah.');
       e.statusCode = 409;
       throw e;
     }
     ```
     Dengan validasi ketat ini:
     - Nilai non-boolean atau truthy palsu seperti `"false"`, `1`, `{}`, `"true"`, `null`, atau `false` akan selalu ditolak dengan HTTP 409 pada kasus final.
     - Seluruh action lain (`ownership`, `schedule`, `clarification`, `evidence`, `outcome`) yang dieksekusi pada kasus final akan selalu ditolak dengan HTTP 409 sekalipun menyertakan `allowRevision: true`.
     - Tindakan `copilot` (draft AI) dan `feedback` (evaluasi model AI) tetap diizinkan karena tidak mengubah klaim maupun memutasi status kasus.
  4. **Pembersihan Antarmuka Frontend:** Pada [frontend/src/pages/CaseDetailPage.jsx](file:///D:/medcare/frontend/src/pages/CaseDetailPage.jsx), parameter `allowRevision` dihapus dari pemanggilan `submitReviewOutcome` dan `uploadSupportingEvidence`, dan hanya dikirimkan secara sah pada pengajuan sanggahan resmi faskes oleh Staff JKN. Modal dan tombol aksi sanggahan dibatasi hanya untuk `currentUser?.role === 'staff_jkn'`.
- **Hasil Verifikasi Otomatis & Isolasi Pengujian:**
  Pengujian keamanan otomatis dijalankan pada database uji sementara yang terisolasi penuh (`jkn_sec01_test_<timestamp>`), dengan fixture reset (`resetCaseFixture`) antar skenario sehingga database operasional `jkn_integrity` tetap 100% utuh tanpa mutasi. Seluruh 24 test otomatis backend lulus (100% pass):
  - Request dispute tanpa token $\rightarrow$ **HTTP 401 (Passed)**
  - `clinical_reviewer` mengirim dispute $\rightarrow$ **HTTP 403 (Passed)**
  - `clinical_reviewer` mengirim dispute dengan `allowRevision: true` $\rightarrow$ **HTTP 403 (Passed)**
  - Token tidak valid / malformed token $\rightarrow$ **HTTP 401 (Passed)**
  - Token sesi kadaluarsa (`auth_sessions.expires_at < now`) $\rightarrow$ **HTTP 401 (Passed)**
  - Token sesi valid dengan peran tidak terdaftar/di luar kewenangan (`auditor_eksternal`) $\rightarrow$ **HTTP 403 (Passed)**
  - Strict boolean validation: Staff JKN mengirim dispute dengan `allowRevision: false` $\rightarrow$ **HTTP 409 (Passed)**
  - Strict boolean validation: Staff JKN mengirim dispute dengan `allowRevision: "false"` $\rightarrow$ **HTTP 409 (Passed)**
  - Strict boolean validation: Staff JKN mengirim dispute dengan `allowRevision: 1` $\rightarrow$ **HTTP 409 (Passed)**
  - Strict boolean validation: Staff JKN mengirim dispute dengan `allowRevision: {}` $\rightarrow$ **HTTP 409 (Passed)**
  - Strict boolean validation: Staff JKN mengirim dispute dengan `allowRevision: "true"` (string) $\rightarrow$ **HTTP 409 (Passed)**
  - Verifikasi integritas: pada seluruh percobaan ditolak, tidak ada dokumen dispute tersimpan, status tetap `CONFIRMED`, tidak ada audit log sukses, dan tidak ada notifikasi dispute diterbitkan $\rightarrow$ **Passed**
  - `staff_jkn` mengirim dispute pada kasus non-final $\rightarrow$ **HTTP 200, status `RECONCILIATION` (Passed)**
  - `staff_jkn` mengirim dispute pada kasus final dengan literal `allowRevision: true` $\rightarrow$ **HTTP 200, status `RECONCILIATION` (Passed)**
  - Table-driven testing action pada status final:
    - Action `ownership` dengan `allowRevision: true` $\rightarrow$ **HTTP 409, status tetap `CONFIRMED` (Passed)**
    - Action `schedule` dengan `allowRevision: true` $\rightarrow$ **HTTP 409, status tetap `CONFIRMED` (Passed)**
    - Action `clarification` dengan `allowRevision: true` $\rightarrow$ **HTTP 409, status tetap `CONFIRMED` (Passed)**
    - Action `evidence` (staf & dokter) dengan `allowRevision: true` $\rightarrow$ **HTTP 409, status tetap `CONFIRMED` (Passed)**
    - Action `outcome` dokter pada kasus final $\rightarrow$ **HTTP 409, status tetap `CONFIRMED` (Passed)**
    - Action `copilot` pada kasus final $\rightarrow$ **HTTP 200, status tetap `CONFIRMED` (Passed)**
    - Action `feedback` pada kasus final $\rightarrow$ **HTTP 200, status tetap `CONFIRMED` (Passed)**
  - Pengguna tidak sah mencoba spoofing role/actor pada payload $\rightarrow$ **HTTP 403 (Passed)**
  - Pengujian langsung service-level `recordCaseAction('dispute')` menolak peran dokter dengan error 403 $\rightarrow$ **Passed**
  - Pengujian langsung service-level `recordCaseAction('evidence')` dengan `allowRevision: true` pada kasus final menolak dengan error 409 $\rightarrow$ **Passed**
  - Pengujian langsung service-level `recordCaseAction('dispute')` dengan `allowRevision: "false"` pada kasus final menolak dengan error 409 $\rightarrow$ **Passed**
  - Pengujian langsung service-level `recordCaseAction('dispute')` menerima peran staf yang sah $\rightarrow$ **Passed**
