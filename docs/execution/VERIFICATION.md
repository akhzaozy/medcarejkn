# Verifikasi pra-deploy — 29 Oktober 2026

## Otomatis

- `npm --prefix backend test`: 23 test lulus. Database unik berawalan jkn_prd_test_, tidak memakai produksi. Cakupan: auth/profil, role403, revoked session401, migrasi idempoten, delapan seed, delapan kombinasi audit, kegagalan koneksi simpan, disposisi/putusan dari actor sesi, bukti pending/terverifikasi, skor/snapshot/history, dispute/copilot/jadwal/feedback, report/config, anomali→kasus pola, regresi katalog/unduhan/pasien BPJS.
- Snapshot logis kasus dan event audit SQLite BPJS identik sebelum/sesudah migrasi. Manifest sumber juga tetap identik.
- `npm --prefix frontend run build`: lulus; chunk per halaman. Peringatan ukuran chunk awal >500kB masih ada.
- `node scripts/diagnostics/reproduce-prd.mjs`: lulus, tidak menulis ulang baseline.
- `node scripts/evaluate/run.mjs`: hash dataset/prediksi/metrik tetap, seed29102026. Hash dataset: 6473dd02e125f803b008581cd4b3e9ff23a56b5ebd4abf16eade170d7f7801c6.
- `docker compose config --quiet`: lulus. Docker daemon lokal tidak tersedia; build image/restart/backup produksi diverifikasi lewat Portainer setelah push.
- `git diff --check`: lulus. Pencarian frasa terlarang UI §12.2/SHAP/angka metrik lama:0 kecocokan.

## Browser lokal

Staging di127.0.0.1:5175 memakai DB hasil test. Browser memakai login normal, bukan bypass demo. Artefak lokal di outputs/prd-qa/ (sengaja tidak masuk Git).

- Lima akun berhasil login, membuka AI & Validasi, dan antrean masing-masing. Budi003/006, Ratna004/008 terlihat.
- Empat preset × simpan true/false: semua status simpan sesuai, tanpa halaman putih, termasuk lebar320px.
- Delapan seed memiliki item dan relasi bukti. Panel copilot001 menampilkan tiga kebutuhan dengan sumber aturan/item; draf dapat diedit, dilampirkan, dibuka kembali, dengan waktu dan nama actor di audit.
- Staf membuka modal jadwal005, simpan, lalu jadwal muncul pada dashboard dari DB. Tidak ada klaim mengirim undangan.
- Threshold60→59 dan kapasitas20→5 memperbarui hasil (Recall@K35.7%→8.9% pada benchmark yang sama), tidak mengubah antrean.
- Lima tab BPJS lama tetap dapat dipilih dan aria-selected=true: Distribusi, Tren bulanan, Kamus variabel, Kamus kode, Contoh detail. Pola Anomali menampilkan sumber; staf membuat kasus pola dan detail membuka snapshot tanpa skor individual.
- Matriks dashboard, antrean staf, evaluasi, data BPJS, dan audit pasien:1366×768,1920×1080,1093×614,390×844,320×740. Semua scrollWidth<=clientWidth setelah perbaikan ID/badge/pagination. Detail klaim, modal jadwal, hasil manual, dan detail pola juga diperiksa pada ukuran kecil.
- Ukuran diuji melalui iframe aplikasi dengan ukuran CSS nyata.1093×614 adalah area ekuivalen laptop1366×768 pada zoom125%, bukan perubahan zoom browser/OS asli. Harness: scripts/diagnostics/viewport-harness.html, dilayani hanya oleh qaServer.
- Saat reload harness iframe, log alat menampilkan tiga MutationObserver errors tanpa URL sumber. Navigasi aplikasi langsung tidak menambah error tersebut; tidak terjadi white screen pada alur utama. Pemeriksaan produksi langsung diperlukan untuk memisahkan error harness dari aplikasi.

## Jalankan ulang

Siapkan PostgreSQL lokal dan .env privat sesuai .env.example; jalankan test, build, lalu node backend/src/scripts/qaServer.js. Buka http://localhost:5175/__qa/viewports. Test membuat akun/sandi acak khusus staging dalam outputs/runtime-auth/qa.json (ignored,0600); jangan unggah atau cetak file ini. Backup lokal ada di outputs/backups; tidak dipublikasikan.
