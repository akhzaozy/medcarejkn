# Eksekusi PRD — laporan pra-deploy, 29 Oktober 2026

Implementasi memakai layout medCare yang ada. Tidak memakai model ML terlatih, LLM, SHAP, pembacaan PDF/OCR, atau putusan klaim otomatis. Skor aturan 0–100 mengikuti konvensi repo, bukan probabilitas.

| Fase / requirement | Hasil dan berkas utama | Verifikasi / batas |
|---|---|---|
| F0; BUG-01..12; R3V.1..3 | Peta repo dan sumber angka lama: `docs/DISCOVERY.md`, `discovery-baseline.json`. Diagnostik lama dipertahankan sebagai baseline; skrip sekarang menguji keadaan hasil perbaikan. | Missing-table dan avatar404 dari audit tidak direproduksi lokal; dibedakan dari bukti produksi/audit sebelumnya. Angka lama tidak dipakai sebagai klaim performa. |
| F1; R1.1..6 | `claimController.js`, `shared/riskEngine.js`, `api/client.js`, `AuditResultHeadline.jsx`, `PageErrorBoundary.jsx`: analisis terpisah dari status simpan, kontrak fallback sama, render defensif. | API dan browser: empat preset × simpan/tidak simpan lulus. Simulasi kegagalan koneksi DB tetap mengembalikan analisis + save.failed. Render parsial diuji SSR. |
| F1; R6.1..7 | Migrasi aditif `database/migrations`, ledger/advisory lock, seed delapan kasus, transaksi aksi di `caseService.js`. Backup pg_dump wajib sebelum migrasi; startup berhenti bila backup/migrasi gagal. | Migrasi dua kali, delapan seed unik dengan item, persistensi penugasan/putusan/bukti/sanggahan/draf/jadwal. Hash snapshot logis SQLite audit BPJS sebelum/sesudah sama. Panduan rollback: `docs/DB_MIGRATION.md`. |
| F1; R9.1..5 | `auth/session.js`, `authController.js`, `shared/userIdentity.js`, `LoginPage.jsx`, `App.jsx`: bcrypt, profil whitelist, cache profil lama dibersihkan, token opaque delapan jam dengan hash di DB, logout mencabut sesi. | Lima login API/UI lulus. Role-only login ditolak; staf→outcome403; dokter lain→outcome403; putusan terminal/penugasan ulang terminal409. Nilai sandi/hash akun tidak ditulis dalam kode/commit/log. |
| F2; R2.1..3; R4.1..2 | `CasesPage.jsx` dan controller: dokter hanya antrean username sendiri, semua mode risiko, dropdown risiko; staf memakai Belum Didisposisi. | Budi melihat003/006, Ratna004/008, kelima akun diuji UI/API. Pilihan staf dipakai karena staf melakukan triase, bukan menerima tugas klinis. |
| F2; R3.1..2; R5.1..2 | Satu kontrak claimItems/evidenceLinks di shared/caseContract.js, backend, demo, dan UI. Unknown ID404; tautan Panduan/notifikasi diperbaiki. | Delapan seed punya item. Bukti PENDING tidak menaikkan coverage; verifikasi manusia memperbarui item/skor. Referensi ganda tidak menggandakan kuantitas. |
| F2; R7.1..2; R8.1..2; R11.1; R12.1 | Menu enam tujuan konsisten, antrean CASE-PB dibedakan dari audit pasien BPJS. Event timestamp/actor konsisten, WIB, avatar inisial, offset header diukur ResizeObserver. CSS membungkus ID panjang, badge, dan pagination. | Matriks viewport dan lima akun: `VERIFICATION.md`. Tabel lebar menggulir di dalam wadahnya; halaman tidak meluber horizontal pada ukuran yang diperiksa. |
| F3; R3E.1..6 | `scripts/evaluate/run.mjs`, `data/benchmark`, `shared/metrics.js`, `validationService.js`, halaman ValidationPage yang diperbarui. Seed/hash/split, metrics, CI bootstrap, skenario/error analysis, threshold/capacity. | Laporan/prediksi/metrik sama ketika dijalankan ulang; hanya evaluatedAt berubah. Split560/240, seed29102026. ML/hybrid unavailable. Hash konfigurasi berbeda membuat API menolak metrik usang503. |
| F3; R3M.1 | Modal klarifikasi dipakai di detail staf, memakai faskes kasus, menyimpan jadwal ke DB dan jejak audit. Dashboard mengambil jadwal tersimpan. | API dan UI simpan→pindah dashboard→jadwal tampil. Undangan dan pelacakan lokasi tidak diimplementasikan; tidak ada pesan undangan terkirim palsu. |
| F4; R4X.1..5 | `RiskEvidencePanels.jsx`, shared engine/config aturan: sinyal/sumber/nilai/ambang/bobot/aksi, max5, skor/prioritas/bukti dipisah, snapshot awal dan riwayat, draf saran untuk dokter. | Bobot berubah→skor berubah; jumlah kontribusi=skor, termasuk cap100. Bukti lengkap mengubah65→0 tanpa mengubah snapshot awal65. Sanggahan memicu evaluasi ulang tetapi teks sanggahan sendiri bukan bukti pendukung kuantitas. |
| F5; R5C.1..5 | `config/evidence_requirements.json`, `shared/evidenceCopilot.js`, panel bukti: tercatat/kesenjangan/pertanyaan/draf/sumber per butir. Salin/lampirkan dicatat. Draf tersimpan dapat dibuka kembali. | Seluruh delapan seed diuji terhadap kebutuhan yang diketahui; referensi PENDING tetap gap. UI lampirkan draf dan event lulus. LLM tidak digunakan; ketentuan feature flag LLM tidak berlaku pada implementasi ini. |
| F6; prasyarat dan sumber D; §12.8 | Kelayakan ditulis sebelum implementasi di `docs/BPJS_ANOMALY_FEASIBILITY.md`. Agregat bulanan dengan baseline3 bulan lampau; volume/nilai/rata-rata tagih, sumber/metode/rasio. Buat kasus pola khusus staf, snapshot agregat, source=anomaly_explorer. | API/UI buat kasus→detail→audit event lulus. Tipe pattern tidak punya skor/claim individual. Peer comparison per faskes dan jaringan tidak didukung data, tidak dibuat. Kelengkapan periode awal dapat memunculkan lonjakan; hasil perlu ditelusuri. |
| F7 opsional; §12.7 | Prioritas→skor untuk pengurutan, kolom skor/bukti/prioritas/status, max3 chip kode aturan dengan tooltip dan filter, konsisten dengan detail/katalog. | Tidak ada priority score gabungan atau probabilitas baru. Precision@K/recall@K dievaluasi di benchmark; mengubah explorer tidak mengubah antrean otomatis. |

## Penerapan referensi (§12.10)

- Katalog aturan dipakai scoring dan ditampilkan; versi/bobot/field/aksi dapat ditinjau.
- Source, snapshot awal, dan versi engine tersimpan. Kasus impor lama yang belum punya snapshot mendapat baseline bertanggal migrasi; keputusan yang mendahuluinya dikecualikan dari metrik berbasis skor awal.
- Role, penugasan penelaah, dan putusan terminal divalidasi server. Skor tidak mengubah putusan manusia.
- Panel menggunakan kontribusi bobot aturan, tanpa label SHAP. Chip positif berasal dari ID aturan yang sama di antrean/detail/katalog; konteks bukti kosong bukan chip aturan positif.
- Threshold/capacity dan PR-AUC/precision@K berasal dari data sintetis, dengan banner sumber.
- Tata Kelola AI menghubungkan Govern/Map/Measure/Manage ke bukti aplikasi; tombol umpan balik dokter menyimpan kasus, versi, skor, alasan, catatan, actor, dan waktu.
- Pencarian frasa terlarang §12.2 serta SHAP di kode UI menghasilkan0 kecocokan. Angka performa lama dihapus. Tidak ada panggilan LLM pada scoring.
- Metodologi hanya mencantumkan tautan NIST yang tersedia dalam PRD; tidak ada angka/klaim dari referensi komersial atau tautan GAO/PubMed yang belum diberikan.

## Risiko dan hal yang sengaja dibatasi

Benchmark adalah skenario sintetis, bukan validasi fraud JKN nyata. Metadata bukti bukan isi dokumen. Kesesuaian dokumen tetap ditelaah manusia. Belum ada alur membuka kembali putusan terminal, pengiriman undangan, live BPJS API, model ML/hybrid, maupun peta kolusi. Data BPJS dan auditnya memakai penyimpanan terpisah dari kasus klaim PostgreSQL.

Dashboard kini merekap antrean dan jadwal DB sesuai akun; angka persentase/jadwal/lokasi contoh tetap telah diganti dengan data aktual atau keadaan kosong. Build membagi halaman dalam chunk terpisah; Vite masih memberi peringatan chunk awal >500kB. Tidak ada klaim benchmark performa perangkat.

## Deployment

Laporan ini mendokumentasikan keadaan pra-deploy. Dua hash akun yang sudah ada telah diizinkan pengguna untuk environment privat stack jkn di Portainer; sandi tidak dirotasi dan nilai aktual tidak masuk Git. Docker memakai Node24 dan PostgreSQL client untuk backup, build context root untuk shared/config/data, pull_policy build, serta volume backup terpisah. Git push dan redeploy dilakukan sesudah verifikasi lokal, lalu hasil produksi diperiksa terpisah.

Hasil produksi sesudah laporan pra-deploy: lihat [DEPLOYMENT.md](DEPLOYMENT.md). Masalah interpolation hash diperbaiki di environment Portainer; backup/migrasi003 berhasil dan login staf/dokter serta indeks pasien telah diverifikasi.
