# Status eksekusi PRD

## Fase 0

Discovery dan baseline tercatat di `docs/DISCOVERY.md` dan `discovery-baseline.json`. Temuan tabel hilang/404 avatar dibedakan dari hasil reproduksi lokal; tidak diklaim sebagai kegagalan lokal.

## Fase 1 — fondasi kritis

- BUG-01: analisis dan status simpan dipisah; fallback lokal memakai engine/kontrak sama; hasil parsial diuji render; Error Boundary per halaman. Uji API 4 preset × 2 opsi simpan lulus, kegagalan koneksi DB tetap menghasilkan analisis. Uji browser opsi simpan berhasil membuka kasus baru tanpa layar putih.
- BUG-06: migrasi PostgreSQL aditif dengan backup, ledger/advisory lock; seed delapan kasus idempoten; data lama tidak ditimpa. Disposisi/putusan dan aksi dokumen menggunakan transaksi. Fallback hanya pada mode demo eksplisit, diberi badge tanpa persistensi.
- BUG-09: profil publik minimum, bcrypt, sesi opaque hash delapan jam, logout mencabut sesi, role diverifikasi server. Tidak ada role-only login atau pesan yang mencetak sandi.
- Verifikasi: `npm --prefix backend test` (17 test lulus pada fondasi); build frontend lulus. Test membuat DB terpisah. API staf→outcome mengembalikan 403; lima akun dapat masuk; migrasi kedua tidak menduplikasi data.
- File utama/alasan: `controllers/claimController.js` (save terpisah), `auth/session.js` dan `authController.js` (sesi/hash), `database/migrations` + `scripts/migrate.js` (persistensi), `caseService.js` (aksi atomik), `shared/riskEngine.js` (kontrak analisis), `api/client.js` (hilangkan sukses palsu), `PageErrorBoundary.jsx`/`AuditResultHeadline.jsx` (ketahanan render), `LoginPage.jsx`/`App.jsx` (profil minimum), tes kontrak/integrasi.
- Belum diterapkan ke produksi pada fase ini; environment hash akun dan migrasi ber-backup harus tersedia sebelum deployment.

## Fase 2 — alur inti

Kontrak evidence tunggal `claimItems`; unknown case mengembalikan 404; filter dokter semua risiko, filter staf belum didisposisi; nama/menu dua antrean dibedakan; event memakai timestamp/actor; avatar inisial; offset header diukur dengan ResizeObserver. Uji browser lanjutan dan matriks resolusi dicatat setelah implementasi fitur selesai. Pemetaan status mempertahankan status lama agar data BPJS tidak berubah.
