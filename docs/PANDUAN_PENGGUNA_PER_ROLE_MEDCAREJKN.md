# PANDUAN PENGGUNA BERDASARKAN PERAN (ROLE-BASED USER GUIDE) MEDCAREJKN

Dokumen ini merupakan panduan operasional pengguna aplikasi **medCareJKN** yang disusun secara faktual berdasarkan kode sumber aktif di lingkungan lokal `D:\medcare`.

---

## 1. PANDUAN UNTUK ROLE: STAFF AUDITOR JKN (`staff_jkn`)

### 1.1. Profil Pengguna & Wewenang
Staff Auditor JKN bertugas melakukan penapisan awal (*triage*), memantau antrean klaim prioritas, menugaskan kasus anomali kepada Dokter Penelaah Medis (*disposisi*), mengelola bukti fisik rekam medis, dan mencatat sanggahan yang diajukan oleh fasilitas kesehatan.

### 1.2. Akun Terdaftar
| Username | Nama Lengkap & Gelar | Jabatan / Unit Kerja | Kasus Terkait di Sistem |
|---|---|---|---|
| `staff.ahmad` | Ahmad Fauzi, S.E. | Senior Verifikator & Triage Klaim BPJS | Verifikator 1 (Koleksi Global Kasus) |
| `staff.adit` | Aditya Pratama, S.Kep. | Verifikator Klaim & Investigasi Faskes | Verifikator 2 (Investigasi Faskes) |

> [!NOTE]
> **Catatan Pengujian Lingkungan Lokal:** Pada lingkungan pengembangan lokal, kata sandi akun staf dikonfigurasi melalui variabel lingkungan backend `JKN_STAFF_PASSWORD_HASH`. Untuk kepraktisan pengujian dan presentasi, gunakan fasilitas tombol cepat akun pada antarmuka login.

### 1.3. Navigasi & Halaman yang Tersedia
Setelah login berhasil, Staff JKN memiliki akses ke seluruh menu pada bilah navigasi atas:
1. **Dashboard (`/`):** Ringkasan KPI klaim, total tagihan terdeteksi berisiko, rasio cakupan bukti, dan kartu *Rencana Audit Prioritas*.
2. **Antrean Kasus Klaim (`/cases`):** Seluruh antrean kasus klaim dari seluruh rumah sakit dengan filter status, prioritas, reviewer, dan modus anomali.
3. **Audit Pasien BPJS (`/input`):** Form audit interaktif instan menggunakan *Rule Engine* deterministik untuk simulasi klaim baru.
4. **Data BPJS (`/bpjs`):** Pratinjau katalog dan distribusi data sampel kohort BPJS 2025 (data de-identifikasi).
5. **AI & Validasi (`/validation`):** Laporan evaluasi performa deteksi pada 800 skenario benchmark sintetis.
6. **Panduan (`/guide`):** Referensi kamus data dan regulasi JKN.

### 1.4. SOP Operasional Harian Staff JKN

#### A. Membuka Berkas Prioritas Tinggi di Dashboard
1. Buka **Dashboard**.
2. Perhatikan kartu **Rencana Audit Prioritas** di baris atas. Kartu ini menampilkan kasus berstatus `OPEN` dengan prioritas `HIGH` (skor risiko $\ge 60$) atau kasus dengan selisih bukti (*evidence gap*) tinggi.
3. Klik tombol **"Buka Berkas Kasus"** untuk langsung menuju halaman **Detail Kasus**.

#### B. Menugaskan Kasus kepada Dokter Penelaah (*Disposisi*)
1. Pada halaman **Detail Kasus**, gulir ke bawah menuju **Bagian 8: Panel Aksi Peran**.
2. Karena Anda login sebagai `staff_jkn`, sistem menampilkan formulir **"Disposisi Berkas ke Dokter Penelaah"**.
3. Pilih dokter spesialis pada dropdown:
   - `dr. Anindya Kusuma, Sp.PK` (Spesialis Patologi Klinik)
   - `dr. Budi Santoso, Sp.A` (Spesialis Anak)
   - `dr. Ratna Dewi, Sp.PD` (Spesialis Penyakit Dalam)
4. Tuliskan instruksi penugasan pada kolom catatan (misal: *"Mohon dokter meninjau kesesuaian tindakan dan kelengkapan bukti rekam medis"*).
5. Klik tombol **"Tugaskan Kasus ke [Nama Dokter]"**.
6. Sistem akan:
   - Mengubah `case_status` menjadi `IN_REVIEW` (menerima status asal `OPEN`, `TRIAGED`, `NEEDS_MORE_EVIDENCE`, `RECONCILIATION`, maupun `ESCALATED`).
   - Memperbarui kolom `assigned_to` dan `assigned_name` (menimpa dokter penelaah sebelumnya secara penuh jika kasus ditugaskan ulang/dialihkan).
   - Menerbitkan notifikasi persisten di database yang ditargetkan langsung ke akun dokter yang baru ditugaskan (`type = 'ASSIGNMENT'`).
   - Mencatat log peristiwa penugasan ke tabel `audit_logs` (`action = 'ASSIGNED_TO_CLINICIAN'`).
   - Memvalidasi otorisasi di tingkat route: wajib role `staff_jkn` (`requireRole('staff_jkn')`). Penugasan ditolak jika kasus sudah berstatus final (`CONFIRMED`, `NOT_CONFIRMED`, `CLOSED`).

#### C. Mengunggah Berkas Bukti Medis Tambahan
1. Pada halaman **Detail Kasus**, gulir ke **Bagian 6: Evidence Chain Traceability**.
2. Temukan formulir **"Unggah Berkas Bukti Pendukung Baru"**.
3. Pilih **Jenis Bukti** (Resume Medis, Laporan Operasi, Hasil Lab/Radiologi, Rincian Farmasi).
4. Masukkan judul dokumen dan nomor referensi rekam medis.
5. Pilih butir tindakan yang berkaitan pada dropdown **Tautkan ke Butir Tindakan**.
6. Pilih berkas dokumen (format didukung: PDF, JPG, PNG, atau DICOM `.dcm`, batas 10 MB).
7. Klik **"Unggah & Tautkan ke Rantai Bukti"**.
8. Sistem akan menyimpan file ke direktori server, mencatat link di `evidence_links`, dan menghitung ulang *Evidence Coverage*.

#### D. Mencatat Sanggahan Resmi dari Fasilitas Kesehatan (*Reconciliation*)
1. Ketika rumah sakit mengajukan keberatan administratif/medis, buka halaman Detail Kasus terkait.
2. Formulir sanggahan dapat diisi pada berkas yang sedang dalam tahap telaah awal maupun lanjutan:
   - **Kasus Non-Final (`OPEN`, `NEW`, `TRIAGED`, `IN_REVIEW`, `NEEDS_MORE_EVIDENCE`, `ESCALATED`):** Sanggahan memutasi status kasus menjadi **`RECONCILIATION`**. *(Catatan: Transisi sanggahan dari status `ESCALATED` didukung secara struktural di kode backend, namun belum diuji secara runtime)*.
   - **Kasus Sudah Berstatus `RECONCILIATION`:** Pengiriman formulir berfungsi mencatat dokumen sanggahan tambahan/susulan ke dalam linimasa sengketa (*dispute trail*), dengan status kasus tetap `RECONCILIATION`.
   - **Kasus Berstatus Final (`CONFIRMED`, `NOT_CONFIRMED`, `CLOSED`):** Tanpa parameter revisi, aksi ditolak oleh backend (`409 Conflict`). Pada antarmuka pengguna `CaseDetailPage.jsx`, sistem secara otomatis menyertakan parameter `allowRevision: true` untuk membuka kembali berkas yang terkunci menuju tahap rekonsiliasi formal.
3. Gulir ke **Bagian 7B: Dispute & Rebuttal Reconciliation Trail**.
4. Pada formulir **"Pencatatan Sanggahan & Rekonsiliasi Faskes"**, masukkan:
   - Judul sanggahan / Nomor Surat Keberatan RS.
   - Uraian argumentasi klinis rumah sakit.
   - Lampirkan surat resmi RS (format PDF/JPG/PNG, batas 10 MB).
5. Klik **"Kirim Sanggahan ke Alur Rekonsiliasi"**.
6. Sistem otomatis memperbarui status kasus menjadi `RECONCILIATION` (atau mencatat lampiran baru jika sudah `RECONCILIATION`), menghitung ulang cakupan bukti jika ada bukti terkait, dan menerbitkan notifikasi ke tim penelaah.

> [!NOTE]
> **Resolusi Keamanan Otorisasi Endpoint Dispute (SEC-01 — RESOLVED):**
> 1. Alur pencatatan sanggahan RS dikhususkan untuk Staff JKN dan dilindungi secara berlapis:
>    - **Lapisan Route:** [backend/src/routes/caseRoutes.js](file:///D:/medcare/backend/src/routes/caseRoutes.js#L18) dilindungi middleware `requireRole('staff_jkn')`.
>    - **Lapisan Service (*Defense in Depth*):** [backend/src/services/caseService.js](file:///D:/medcare/backend/src/services/caseService.js#L368) memvalidasi `actor?.role === 'staff_jkn'` sebelum memeriksa status kasus atau parameter `allowRevision`.
>    - **Lapisan Frontend:** Tombol dan modal sanggahan pada `CaseDetailPage.jsx` hanya ditampilkan untuk akun ber-role `staff_jkn`.
> 2. Pengguna selain Staff JKN (termasuk `clinical_reviewer`) ditolak langsung dengan status HTTP 403, dan tidak dapat membuka kembali berkas kasus final menggunakan `allowRevision: true`. Seluruh alur telah terverifikasi melalui 24 uji otomatis backend.

---

## 2. PANDUAN UNTUK ROLE: DOKTER PENELAAH MEDIS (`clinical_reviewer`)

### 2.1. Profil Pengguna & Wewenang
Dokter Penelaah Medis (*Clinical Reviewer*) adalah dokter spesialis yang bertugas memberikan evaluasi medis obyektif terhadap klaim yang didisposisikan, menelaah kesesuaian diagnosis vs tindakan, memeriksa kelengkapan rekam medis, dan menetapkan hasil telaah klinis (*Review Outcome*).

### 2.2. Akun Terdaftar
| Username | Nama Lengkap & Gelar | Spesialisasi Klinis | Unit Kerja |
|---|---|---|---|
| `dr.anindya` | dr. Anindya Kusuma, Sp.PK | Spesialis Patologi Klinik | TKMKB JKN (DPJP 1) |
| `dr.budi` | dr. Budi Santoso, Sp.A | Spesialis Anak | TKMKB JKN (DPJP 2) |
| `dr.ratna` | dr. Ratna Dewi, Sp.PD | Spesialis Penyakit Dalam | TKMKB JKN (DPJP 3) |

### 2.3. Ruang Kerja & Isolasi Kasus Dokter
- **Filter Otomatis "Kasus Saya":** Pada halaman Antrean Kasus (`/cases`), backend secara otomatis memfilter tampilan kasus sesuai username dokter yang sedang login (`assignedTo = req.user.username`). Dokter hanya menelaah kasus yang menjadi tanggung jawabnya.
- **Lonceng Notifikasi:** Ikon lonceng pada navbar memeriksa pembaruan berkala setiap **15 detik**. Ketika staf menugaskan kasus baru, badge merah akan muncul. Mengklik notifikasi akan langsung membuka kasus tersebut.

### 2.4. SOP Operasional Harian Dokter Penelaah

#### A. Membuka Berkas Kasus yang Ditugaskan
1. Periksa ikon **Lonceng Notifikasi** di navbar atas. Jika ada penugasan baru, klik kartu notifikasi.
2. Atau buka menu **Antrean Kasus Klaim** (`/cases`), pilih baris kasus yang berstatus `IN_REVIEW`.
3. Halaman **Detail Kasus** akan terbuka secara utuh.

#### B. Menelaah Rincian Kasus Secara Sekuensial
Halaman Detail Kasus menyajikan informasi terstruktur dalam 8 seksi berurutan:
1. **Seksi 1 - Lifecycle Stepper:** Melihat posisi tahapan kasus (Deteksi $\rightarrow$ Penugasan $\rightarrow$ Telaah $\rightarrow$ Rekonsiliasi).
2. **Seksi 2 & 3 - Case Header & Executive Summary:** Membaca diagnosis utama ICD-10, prosedur ICD-9-CM, total tagihan, skor risiko aturan, dan persentase cakupan bukti.
3. **Seksi 4 - Side-by-Side Comparison:** Membandingkan ringkasan tagihan yang diklaim RS dengan fakta dokumen rekam medis yang ada.
4. **Seksi 6 & 7 - Evidence Chain & Claim Items Table:** Memeriksa status setiap item tindakan apakah berstatus `SUPPORTED`, `UNAVAILABLE`, atau `PARTIAL`.
5. **Seksi 7B - Dispute Trail:** Membaca argumentasi dan lampiran jika rumah sakit telah mengajukan sanggahan.

#### C. Menetapkan Hasil Telaah Klinis (*Review Outcome*)
Dokter Penelaah Medis dapat menetapkan hasil telaah klinis pada berkas kasus yang berstatus `IN_REVIEW`, `NEEDS_MORE_EVIDENCE` (setelah penelaahan lanjutan/klarifikasi), maupun `RECONCILIATION` (setelah sanggahan dan bukti tambahan diperiksa bersama):
1. Gulir ke **Bagian 8: Keputusan Telaah Klinis Dokter (Review Outcome)**.
2. Tinjau panel **Saran Sistem Berbasis Aturan (`rules-1.0.0`)**:
   - Sistem menampilkan draf tindak lanjut rekomendasi aturan dan kontribusi pemicu. Anda dapat mengklik tombol *"Terapkan Draf Saran ke Formulir"* sebagai titik awal draf.
3. Pilih salah satu dari **4 Kartu Pilihan Keputusan Klinis**:
   - **`NEEDS_MORE_EVIDENCE` (Perlu Konfirmasi Berkas):** **(PILIHAN WAJIB BILA BUKTI BELUM LENGKAP)**. Jika berkas fisik pendukung dari faskes belum ditemukan atau belum mencukupi untuk menarik kesimpulan klinis, dokter memilih opsi ini untuk meminta konfirmasi dokumen fisik resmi. Status kasus akan bertransisi menjadi `NEEDS_MORE_EVIDENCE`.
   - **`CONFIRMED` (Temuan Terkonfirmasi oleh Reviewer):** Pilih opsi ini jika telaah medis membuktikan secara konklusif bahwa tindakan tidak dilakukan, terjadi tagihan ganda, atau disparitas terbukti nyata tanpa pembenaran medis. Status kasus berubah menjadi `CONFIRMED`.
   - **`NOT_CONFIRMED` (Klaim Wajar / Valid):** Pilih opsi ini jika telaah medis membuktikan tindakan sah, indikasi sesuai standar klinis, dan tagihan dapat dipertanggungjawabkan. Status kasus pada tabel `cases` berubah menjadi `NOT_CONFIRMED`.
   - **`FALSE_POSITIVE` (False Positive):** Pilih opsi ini jika sinyal anomali muncul akibat kesalahan pencatatan teknis atau kekeliruan aturan sistem. Nilai mentah `FALSE_POSITIVE` tersimpan di tabel `review_outcomes`, sedangkan status kasus pada tabel `cases` dipetakan oleh backend menjadi `NOT_CONFIRMED`.

> [!NOTE]
> **Komparasi Outcome Backend vs Antarmuka Dokter:**
> - **4 Pilihan pada Form UI Dokter:** `CONFIRMED`, `NOT_CONFIRMED`, `NEEDS_MORE_EVIDENCE`, `FALSE_POSITIVE`.
> - **5 Nilai Diterima Backend API (`submitCaseOutcome`):** `CONFIRMED`, `NOT_CONFIRMED`, `NEEDS_MORE_EVIDENCE`, `FALSE_POSITIVE`, `ESCALATED`.
> - **Pemetaan ke Status Kasus (`cases.case_status`):** `CONFIRMED` $\rightarrow$ `CONFIRMED`; `NEEDS_MORE_EVIDENCE` $\rightarrow$ `NEEDS_MORE_EVIDENCE`; `ESCALATED` $\rightarrow$ `ESCALATED`; sedangkan baik `NOT_CONFIRMED` maupun `FALSE_POSITIVE` sama-sama memutasi status akhir kasus menjadi **`NOT_CONFIRMED`**.
> - **Status `ESCALATED`:** `ESCALATED` didukung secara sah pada backend API, namun tidak disediakan sebagai kartu pilihan pada formulir penelaahan klinis di `CaseDetailPage.jsx`. Opsi `ESCALATED` tetap tersedia pada dropdown filter antrean kasus di `CasesPage.jsx`.

> [!NOTE]
> **Pembedaan SOP Medis vs Validasi Teknis Backend pada Kasus `RECONCILIATION`:**
> - **Validasi Teknis Backend:** Pada fungsi `submitCaseOutcome`, backend hanya memeriksa status kasus bukan status final (kasus berstatus final ditolak HTTP 409), kecocokan penugasan dokter (`currentCase.assigned_to === reviewerId`), format enum outcome valid, dan catatan telaah tidak kosong. Backend **tidak memverifikasi secara teknis** apakah dokter telah membaca dokumen sanggahan atau apakah bukti baru telah diunggah.
> - **Kepatuhan SOP Medis:** Berdasarkan tata kelola audit BPJS Kesehatan, dokter penelaah berkewajiban mempelajari dokumen sanggahan Faskes dan bukti medis tambahan pada berkas sebelum menetapkan putusan klinis baru. Ini adalah aturan kepatuhan operasional (SOP), bukan pembatasan teknis (*hard-guard*) kode backend.

4. Isi **Catatan Pertimbangan Medis & Rekomendasi Klinis** (wajib diisi dengan uraian telaah profesional DPJP). Anda juga dapat menggunakan tombol *"+ Isi Draf Catatan Sesuai Pilihan"*.
5. Klik tombol **"Simpan Keputusan Telaah Klinis"**.
6. Sistem akan:
   - Menyimpan hasil telaah ke tabel `review_outcomes`.
   - Memperbarui status kasus pada tabel `cases`.
   - Merekam stempel waktu dan identitas dokter ke tabel `audit_logs`.
   - Mengirimkan sinyal notifikasi balik ke seluruh pengguna ber-role `staff_jkn`.

---

## 3. KLARIFIKASI STATUS ROLE FASILITAS KESEHATAN (FASKES) & IDENTITAS AKTOR SANGGAHAN

Berdasarkan arsitektur perangkat lunak MedCareJKN:
1. **Pihak yang Diwakili (*Represented Entity*):** Rumah Sakit / Faskes tidak memiliki akun pengguna mandiri maupun portal login untuk masuk ke antarmuka aplikasi. Seluruh interaksi Faskes disampaikan secara eksternal (surat resmi, berita acara sanggahan, berkas rekam medis cetak/PDF).
2. **Pengguna Pencatat (*Recording User*):** Staff JKN internal yang sedang login memegang sesi aktif, yang mencatat berkas fisik sanggahan dari Faskes ke dalam modul *Rekonsiliasi Sanggahan* (Bagian 7B `CaseDetailPage.jsx`).
3. **Dokter Penelaah (*Clinical Reviewer*):** Dokter Spesialis (DPJP) yang ditugaskan untuk menelaah secara klinis apakah sanggahan Faskes dapat diterima atau ditolak.

> [!NOTE]
> **Keterbatasan Penyimpanan Identitas Aktor Sanggahan di Database:**
> - Saat formulir sanggahan dikirim, frontend mengirim payload berisi `role: 'Fasilitas Kesehatan (Rumah Sakit)'` dan `actor: 'Komite Medik [Nama RS]'`.
> - Pada backend ([caseService.js](file:///D:/medcare/backend/src/services/caseService.js)), kolom `actor` di tabel `case_documents` dan kolom `actor_id` di tabel `audit_logs` menyimpan username staf pencatat (`actor.username`, misal `staff.ahmad`).
> - Saat endpoint `getCaseDetail` merangkum riwayat sanggahan, kode backend menimpa properti `actor` dengan username staf pencatat (`actor: d.actor`), sehingga pada tampilan riwayat sanggahan nama yang muncul adalah nama staf pencatat bersanding dengan badge role `'Fasilitas Kesehatan (Rumah Sakit)'`.
> - Skema data belum memisahkan kolom pencatat (*recorded_by_user*) dan entitas yang diwakili (*representing_entity*). Ini dicatat sebagai **keterbatasan implementasi**, dan kode dipertahankan tanpa perubahan.

---

## 4. PERTANYAAN UMUM & PENANGANAN KENDALA (FAQ)

### Q1: Mengapa notifikasi tidak muncul seketika saat tindakan disimpan di tab lain?
**Jawaban:** Notifikasi antar-pengguna bekerja menggunakan **polling berkala per 15 detik** dari database PostgreSQL, bukan koneksi push WebSocket/SSE. Selain itu, mengeklik ikon lonceng di navbar akan memicu pemanggilan API pembaruan data secara langsung (*on-demand refresh*). Record notifikasi sendiri telah tersimpan secara sinkron di basis data saat transaksi SQL commit dilakukan.

### Q2: Mengapa tombol "Simpan Keputusan Telaah" ditolak dengan pesan peringatan penugasan?
**Jawaban:** Berdasarkan aturan keamanan klinis, hanya dokter penelaah yang tercatat pada kolom `assigned_to` yang berhak menyimpan keputusan pada berkas tersebut. Jika kasus belum ditugaskan (*Unassigned*), akun Staff JKN harus mendisposisikannya terlebih dahulu.

### Q3: Apakah skor risiko yang tinggi (misal 65) berarti klaim tersebut pasti kecurangan (*fraud*)?
**Jawaban:** **TIDAK.** Skor risiko MedCareJKN adalah hasil penjumlahan bobot aturan (*explainable rule weight sum*) yang mendeteksi adanya ketidaksesuaian administratif atau bukti yang belum tercatat. Keputusan sah atau tidaknya klaim sepenuhnya berada di tangan Dokter Penelaah Klinis berdasarkan standar profesi kedokteran.
