# Agenda Eksekusi Probis Rekonsiliasi Kasus (Staff JKN <-> DPJP)

Dokumen ini mencatat status implementasi terakhir dan langkah-langkah yang akan langsung dieksekusi besok.

---

## 1. Status Selesai Hari Ini (Sudah Commit & Push ke GitHub)

1. **Akun Staff JKN Baru**:
   - Akun **Ahmad Fauzi, S.E.** (`staff.ahmad`) dan **Aditya Pratama, S.Kep.** (`staff.adit`) sudah aktif.
   - Tersedia tombol quick-selection card di halaman login dan terintegrasi di backend `authController.js`.
2. **Penghapusan Template Statis**:
   - Data kasus digenerate secara realistis dan kontekstual sesuai nama rumah sakit (`case.provider_name`) dan tipe anomali (*Phantom Billing*, *Wrong Diagnosis*, *Ghost Enrollee*).
   - Kasus baru yang belum diproses berstatus `OPEN` memiliki riwayat sanggahan kosong (`disputes: []`), tidak lagi menampilkan template fiktif *RS Citra Medika*.
3. **Engine Re-Evaluasi Machine Learning Real-Time**:
   - `calculateCaseMlRecommendation`: otomatis menghitung ulang tingkat keyakinan (confidence score) dan saran putusan saat bukti fisik baru diunggah.
4. **Lonceng & Dropdown Notifikasi Navbar**:
   - Terpasang di header dengan badge jumlah unread, list notifikasi sanggahan & berkas baru, tombol tandai dibaca, dan direct navigation ke kasus terkait (`onSelectCase`).
5. **API Client & Dynamic Case Store**:
   - Method `takeCaseOwnership`, `sendClarificationRequestToClinician`, `submitDisputeRebuttal`, `uploadSupportingEvidence`, dan notification helpers telah aktif di `frontend/src/api/client.js`.
6. **Kompilasi Sukses**:
   - `npm run build` sukses 100% tanpa error (Vite build 1.83s).

---

## 2. Langkah Eksekusi Besok

Besok kita akan langsung menyelesaikan 5 komponen UI pada berkas `frontend/src/pages/CaseDetailPage.jsx`:

### Langkah 1: Pita Kepemilikan Kasus (Ownership Banner)
- Letak: Tepat di bawah navigasi breadcrumb.
- Menampilkan:
  - Nama verifikator penanggung jawab (`Ahmad Fauzi` / `Aditya Pratama` / `Belum Diambil`).
  - Tombol aksi: `Ambil Kasus Ini (Handle Kasus)` jika login sebagai Staff JKN.

### Langkah 2: Modal Kirim Permintaan Klarifikasi ke DPJP
- Tombol `Kirim Klarifikasi ke DPJP` pada aksi Staff JKN.
- Modal pop-up dengan input:
  - Pilihan Dokter DPJP tujuan (`dr. Anindya`, `dr. Budi`, `dr. Ratna`).
  - Catatan pertanyaan investigasi mengenai celah berkas medis yang perlu disanggah.
  - Saat dikirim, kasus berpindah status ke `IN_REVIEW` ("Menunggu Sanggahan DPJP") dan memicu notifikasi.

### Langkah 3: Formulir Sanggahan DPJP dengan Lampiran Wajib
- Pada modal sanggahan dokter/faskes (`showDisputeModal`):
  - Dokter wajib mengisi argumen klinis dan melampirkan berkas bukti fisik (Laporan Bedah, Hasil Lab, CPPT, dsb.).
  - Saat sanggahan dikirim, berkas otomatis terlampir ke kasus dan memicu re-evaluasi Machine Learning.

### Langkah 4: Banner Visual Re-Evaluasi Machine Learning
- Menampilkan alert banner interaktif warna teal/hijau saat ML selesai menghitung ulang skor kasus:
  - Menunjukkan penurunan skor anomali (misal: dari 94.6% menjadi 13.8%) karena bukti fisik telah dipenuhi.

### Langkah 5: Visualisasi Timeline Looping Sanggahan (Section 7B)
- Membedakan balon riwayat percakapan antara:
  - Pertanyaan dari **Staff Verifikator BPJS** (Ahmad/Adit).
  - Tanggapan & berkas dari **DPJP / Komite Medik Rumah Sakit**.
- Tombol aksi Staff: `Minta Klarifikasi Lanjutan` (looping) atau `Lanjutkan ke Putusan Akhir`.

---

*Disimpan pada: 15 September 2026, 02:40 WIB*
