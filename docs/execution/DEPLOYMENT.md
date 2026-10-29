# Hasil deployment — 29 Oktober 2026

Aplikasi: https://jkn.akhzafachrozy.my.id/ · Portainer endpoint3, stack jkn(id13), Git main. Implementasi aplikasi berada pada commit f3098dcce141006a1f27de904f300f153c90fbd4.

## Pemulihan startup

Redeploy awal sempat membuat backend restart karena nilai bcrypt pada environment dipotong oleh interpolation Compose. Pemeriksaan container hanya mengeluarkan metadata panjang/format, bukan hash. Pengguna mengizinkan dua hash akun yang sudah ada disimpan pada environment privat stack. Kedua nilai dibungkus petik tunggal di Portainer dan stack diperbarui; sandi akun tidak diubah.

Setelah pembaruan pada sekitar12:51 WITA, frontend/backend berstatus running dan PostgreSQL healthy. Log backend mencatat:

```
[Migration] {"status":"migrated","version":"20261029_003","backupFile":"before-20261029_003-1793249511635.dump"}
[medCare JKN] Server running on port 3000
```

Backup berada dalam volume migration_backups, bukan Git. Tidak ada reset/DROP/TRUNCATE atau perubahan tabel audit BPJS. Migrasi ledger berikutnya bersifat idempoten.

## Pemeriksaan web produksi

- Login normal staff.ahmad berhasil; dashboard membaca delapan kasus seed dari PostgreSQL.
- Audit Pasien BPJS menampilkan20 peserta pada halaman pertama; pesan indeks belum tersedia/sedang disiapkan tidak muncul.
- AI & Validasi → Evaluasi tampil dengan PR-AUC dari laporan dan banner label sintetis.
- Logout lalu login dr.budi berhasil dengan sandi akun yang sama;003(UPCODING) dan006(UNNECESSARY_PROCEDURES) terlihat pada antreannya dan filter semua mode tersedia.
- Konsol halaman produksi pada alur yang diperiksa tidak mengandung error.
- Bukti gambar lokal: outputs/prd-qa/production-validation.png (tidak dipublikasikan ke Git).

Pengujian lebih luas di staging tercatat pada VERIFICATION.md:23 test otomatis, lima akun UI, delapan kombinasi preset/simpan, alur draf/jadwal/pola, dan matriks viewport. Metrik benchmark tetap sintetis; belum ada model ML terlatih atau koneksi BPJS live.
