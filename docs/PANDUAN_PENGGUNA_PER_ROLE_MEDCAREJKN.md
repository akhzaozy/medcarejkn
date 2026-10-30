# PANDUAN PENGGUNA BERDASARKAN PERAN (ROLE-BASED USER GUIDE) MEDCAREJKN

Dokumen ini merupakan panduan operasional pengguna aplikasi **medCareJKN** yang disusun secara faktual berdasarkan kode sumber aktif dan implementasi 3 fokus utama di lingkungan lokal `D:\medcare` per **30 Oktober 2026**.

---

## 1. PANDUAN UNTUK ROLE: STAFF AUDITOR JKN (`staff_jkn`)

### 1.1. Profil Pengguna & Wewenang
Staff Auditor JKN bertugas melakukan penapisan awal (*triage*), memantau antrean klaim 3 fokus utama, menugaskan kasus berisiko kepada Dokter Penelaah Medis (*disposisi*), mengelola bukti fisik rekam medis, dan mencatat sanggahan yang diajukan oleh fasilitas kesehatan.

### 1.2. Akun Terdaftar
| Username | Nama Lengkap & Gelar | Jabatan / Unit Kerja | Kasus Terkait di Sistem |
|---|---|---|---|
| `staff.ahmad` | Ahmad Fauzi, S.E. | Senior Verifikator & Triage Klaim BPJS | Verifikator 1 (Koleksi Global Kasus) |
| `staff.adit` | Aditya Pratama, S.Kep. | Verifikator Klaim & Investigasi Faskes | Verifikator 2 (Investigasi Faskes) |

### 1.3. Navigasi & Menu Operasional yang Tersedia
Setelah login berhasil, Staff JKN memiliki akses ke **4 Menu Operasional Terpadu**:
1. **Beranda (`landing`):** Ringkasan KPI klaim, total tagihan berisiko, rasio cakupan bukti medis, dan kartu *Rencana Audit Prioritas*.
2. **Antrean Kasus (`cases`):** Daftar seluruh berkas klaim dengan filter 3 fokus (`FOCUS`), status, prioritas, penugasan dokter, dan pencarian cepat.
3. **Uji Klaim Manual (`input`):** Formulir interaktif untuk evaluasi klaim seketika menggunakan 4 mode audit (`ALL`, `PHANTOM_BILLING`, `UPCODING`, `EVIDENCE_REVIEW`).
4. **Panduan (`guide`):** Referensi pedoman audit, dasar hukum regulasi JKN, dan kamus data.

*(Catatan: Modul warisan non-fokus seperti Data BPJS dan AI/Validasi telah dinonaktifkan dari antarmuka operasional dan endpoint-nya diblokir dengan HTTP 403).*

### 1.4. SOP Operasional Harian Staff JKN

#### A. Memantau Antrean Kasus 3 Fokus Utama
1. Buka menu **Antrean Kasus**.
2. Pada dropdown *Modus / Fokus*, gunakan opsi **"Fokus 3 Fitur Utama (FOCUS)"**.
3. Sistem secara otomatis menyaring kasus yang masuk dalam domain:
   - **Phantom Billing (`PHANTOM_BILLING`):** Klaim dengan kuantitas tertagih melebihi bukti layanan fisik yang terverifikasi (Aturan PB-01).
   - **Upcoding (`UPCODING`):** Klaim dengan nominal tagihan melebihi tarif acuan standar INA-CBG (Aturan UC-01).
   - **Evidence Review (`EVIDENCE_REVIEW`):** Rekonsiliasi butir klaim terhadap kelengkapan dokumen pendukung menggunakan `reconcileItem()`.
   - **Kasus Belum Lengkap Bukti (`UNAVAILABLE`):** Kasus di mana bukti belum tersedia sehingga berstatus `review_priority = 'NO_CONCLUSION'` dan `risk_score = 0`. Kasus ini tetap dipantau untuk meminta kelengkapan berkas ke rumah sakit.

#### B. Menugaskan Kasus kepada Dokter Penelaah (*Disposisi*)
1. Pada halaman **Detail Kasus**, gulir ke **Bagian 8: Disposisi Berkas ke Dokter Penelaah**.
2. Pilih dokter spesialis pada dropdown:
   - `dr. Anindya Kusuma, Sp.PK` (Spesialis Patologi Klinik)
   - `dr. Budi Santoso, Sp.A` (Spesialis Anak)
   - `dr. Ratna Dewi, Sp.PD` (Spesialis Penyakit Dalam)
3. Tuliskan catatan instruksi penugasan (misal: *"Mohon dokter menelaah kelayakan tindakan bedah dan kelengkapan laporan operasi"*).
4. Klik tombol **"Tugaskan Kasus ke [Nama Dokter]"**.
5. Sistem akan:
   - Memutasi status berkas kasus menjadi **`IN_REVIEW`**.
   - Memperbarui kolom `assigned_to` dan `assigned_name`.
   - Menerbitkan notifikasi persisten di PostgreSQL ke akun dokter target.
   - Mencatat peristiwa ke tabel `audit_logs`.

#### C. Mengunggah Berkas Bukti Medis Tambahan
1. Pada halaman Detail Kasus, gulir ke **Bagian 6: Evidence Chain Traceability**.
2. Masukkan jenis bukti, nomor rekam medis, dan judul dokumen.
3. Tautkan dokumen ke butir tindakan yang bersangkutan.
4. Unggah berkas dokumen (PDF, JPG, PNG, atau DICOM batas 10 MB).
5. Klik **"Unggah & Tautkan ke Rantai Bukti"**.
6. Sistem menyimpan file secara aman, mencatat relasi di `evidence_links`, dan menghitung ulang cakupan bukti medis (*Evidence Coverage Pct*).

#### D. Mencatat Sanggahan Resmi Fasilitas Kesehatan (*Reconciliation*)
1. Ketika Faskes mengajukan keberatan medis/surat sanggahan, buka halaman Detail Kasus terkait.
2. Gulir ke **Bagian 7B: Rekonsiliasi Sanggahan Faskes**.
3. Masukkan nomor surat keberatan RS, pokok argumentasi klinis, dan lampirkan surat resmi RS.
4. Klik **"Kirim Sanggahan ke Alur Rekonsiliasi"**.
5. Status kasus bertransisi menjadi **`RECONCILIATION`** dan notifikasi terbit ke dokter penelaah.

---

## 2. PANDUAN UNTUK ROLE: DOKTER PENELAAH MEDIS (`clinical_reviewer`)

### 2.1. Profil Pengguna & Wewenang
Dokter Penelaah Medis (*Clinical Reviewer*) adalah dokter spesialis yang bertugas memberikan evaluasi klinis independen dan obyektif terhadap klaim yang didisposisikan, menelaah kesesuaian tindakan medis vs diagnosis, memeriksa rekam medis, dan menetapkan hasil telaah klinis (*Review Outcome*).

### 2.2. Akun Terdaftar
| Username | Nama Lengkap & Gelar | Spesialisasi Klinis | Unit Kerja |
|---|---|---|---|
| `dr.anindya` | dr. Anindya Kusuma, Sp.PK | Spesialis Patologi Klinik | TKMKB JKN (DPJP 1) |
| `dr.budi` | dr. Budi Santoso, Sp.A | Spesialis Anak | TKMKB JKN (DPJP 2) |
| `dr.ratna` | dr. Ratna Dewi, Sp.PD | Spesialis Penyakit Dalam | TKMKB JKN (DPJP 3) |

### 2.3. Ruang Kerja & Isolasi Kasus Dokter
- **Isolasi "Kasus Saya":** Pada menu Antrean Kasus, sistem secara otomatis membatasi daftar kasus sesuai username dokter yang login (`assigned_to = req.user.username`). Dokter tidak dapat melihat atau mengubah kasus penugasan dokter lain.
- **Notifikasi Penugasan:** Ikon lonceng pada navbar melakukan pembaruan berkala setiap **15 detik** serta **on-demand refresh** saat diklik.

### 2.4. SOP Operasional Penelaahan Klinis

#### A. Menelaah Rincian Kasus Secara Sekuensial
Halaman Detail Kasus menyajikan 8 seksi sekuensial yang komprehensif:
1. **Seksi 1 (Lifecycle Stepper):** Mengetahui status tahapan berkas.
2. **Seksi 3 (Executive Summary):** Memeriksa Diagnosis ICD-10, Prosedur ICD-9-CM, total tagihan, dan persentase bukti.
3. **Seksi 4 (Side-by-Side View):** Komparasi tagihan RS vs bukti rekam medis.
4. **Seksi 6 & 7 (Evidence Chain & Items Table):** Menilai butir tindakan apakah `SUPPORTED`, `UNAVAILABLE`, atau `PARTIAL`.
5. **Seksi 7B (Dispute Trail):** Mempelajari surat sanggahan dan dokumen klarifikasi rumah sakit jika ada.

#### B. Menetapkan Hasil Telaah Klinis (*Review Outcome*)
1. Gulir ke **Bagian 8: Keputusan Telaah Klinis Dokter (Review Outcome)**.
2. Pilih salah satu dari **4 Pilihan Keputusan Klinis**:
   - **`NEEDS_MORE_EVIDENCE` (Perlu Konfirmasi Berkas):** Pilih opsi ini jika bukti fisik rekam medis belum lengkap atau belum cukup untuk menarik kesimpulan klinis. **Sistem tidak boleh memvonis fraud jika bukti belum lengkap**.
   - **`CONFIRMED` (Temuan Terkonfirmasi):** Pilih opsi ini jika bukti klinis membuktikan secara meyakinkan adanya tindakan fiktif (*phantom billing*) atau kenaikan tarif yang tidak sesuai standar medis (*upcoding*). Kasus bertransisi ke status final `CONFIRMED`.
   - **`NOT_CONFIRMED` (Klaim Wajar / Sah):** Tindakan medis terbukti sah, berindikasi jelas, dan layak dibayarkan. Kasus bertransisi ke status final `NOT_CONFIRMED`.
   - **`FALSE_POSITIVE` (False Positive):** Anomali terpicu akibat kesalahan administratif/aturan sistem. Tersimpan di `review_outcomes` sebagai `FALSE_POSITIVE` dan status kasus dipetakan menjadi `NOT_CONFIRMED`.
3. Tuliskan **Catatan Pertimbangan Medis** secara jelas dan profesional.
4. Klik tombol **"Simpan Keputusan Telaah Klinis"**.
5. Sistem menyimpan putusan secara permanen ke `review_outcomes`, memperbarui status di `cases`, dan mengirimkan notifikasi balik ke Staff JKN.

---

## 3. KLARIFIKASI STATUS ROLE FASILITAS KESEHATAN (FASKES) & PEMBATASAN SEC-01

### A. Fasilitas Kesehatan adalah Entitas Eksternal Tanpa Login
1. Rumah Sakit atau Fasilitas Kesehatan **tidak memiliki akun pengguna mandiri maupun portal login ke dalam sistem MedCareJKN**.
2. Seluruh interaksi Faskes (pengiriman berkas rekam medis dan surat keberatan) dilakukan secara eksternal.
3. **Staff JKN bertindak sebagai pengguna pencatat resmi** yang memasukkan dokumen sanggahan rumah sakit ke dalam sistem pada Bagian 7B mewakili pihak faskes.

### B. Proteksi Keamanan Status Final (SEC-01 Hardening)
1. Berkas kasus yang telah berstatus final (`CONFIRMED`, `NOT_CONFIRMED`, `CLOSED`) terkunci dari seluruh modifikasi langsung.
2. Pembukaan kembali kasus final ke tahap `RECONCILIATION` **HANYA DAPAT DILAKUKAN OLEH STAFF JKN** dengan menyertakan parameter literal boolean ketat:
   $$\text{allowRevision} === \text{true}$$
3. Percobaan pembukaan revisi oleh akun dokter penelaah (`clinical_reviewer`) **DITOLAK DENGAN HTTP 403 FORBIDDEN**.
4. Parameter yang bukan bernilai boolean `true` (misalnya string `"true"`, angka `1`, objek `{}`) **DITOLAK DENGAN HTTP 409 CONFLICT**.
5. Seluruh mekanisme ini memastikan data audit terjaga dari perubahan sepihak dan memiliki akuntabilitas hukum yang kuat.

---

## 4. PERTANYAAN UMUM (FAQ)

### Q1: Mengapa ketiadaan bukti rekam medis tidak otomatis diberi skor fraud tinggi?
**Jawaban:** MedCareJKN menganut asas kehati-hatian klinis dan praduga tak bersalah. Ketiadaan bukti fisik (*evidenceAvailable = false*) dikategorikan sebagai `UNAVAILABLE` dengan prioritas `NO_CONCLUSION` dan skor 0. Ini adalah kesenjangan pembuktian administratif yang mewajibkan konfirmasi ke faskes, bukan vonis kejahatan kecurangan (*fraud*).

### Q2: Mengapa tombol telaah dokter hanya aktif pada dokter tertentu?
**Jawaban:** Sistem menerapkan isolasi tanggung jawab medis (*Role-Based Access Control*). Hanya dokter spesialis yang ditugaskan pada kolom `assigned_to` berkas tersebut yang berhak menyimpan hasil telaah klinis demi mencegah konflik kewenangan.
