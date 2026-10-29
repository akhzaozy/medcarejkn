# Migrasi stabilitas (BUG-06 / BUG-09)

Jalankan `npm --prefix backend run migrate`. Skrip memakai konfigurasi PostgreSQL dari lingkungan, mengambil advisory lock, memeriksa ledger, membuat backup custom pg_dump dengan permission 0600, lalu menerapkan migrasi dan seed dalam satu transaksi. Tidak ada DROP/TRUNCATE/reset. Ledger rilis20261029_003 mencakup skema001, tipe pola002, dan baseline bertanggal untuk kasus impor yang belum memiliki snapshot. Snapshot/putusan/bukti yang sudah ada dipertahankan; prioritas analitik kasus lama dinormalisasi dari bukti tercatat ketika baseline dibuat. Eksekusi kedua hanya memeriksa akun yang belum diinisialisasi dan versi konfigurasi.

Backup berada di `JKN_BACKUP_DIR` atau `outputs/backups`. Backup, sesi, dan konfigurasi akun tidak boleh masuk Git. PostgreSQL dan SQLite audit BPJS terpisah; migrasi tidak membuka file audit BPJS.

Akun normal membutuhkan `JKN_STAFF_PASSWORD_HASH` dan `JKN_CLINICIAN_PASSWORD_HASH` (bcrypt). Isi melalui secret/environment deployment, jangan letakkan nilai nyata di Compose/Git. Akun yang sudah ada di `app_users` tidak direset. Tidak ada bypass role-only, password alternatif, atau password dalam respons. Sesi opaque disimpan sebagai SHA-256 di PostgreSQL, berlaku delapan jam, dan dicabut saat logout. UI menyimpan profil minimum; cache profil lama dibersihkan.

Rollback: hentikan container backend baru, kembali ke tag/commit aplikasi sebelumnya, dan pertahankan tabel aditif agar tidak menghilangkan data baru. Jika restore benar-benar diperlukan, buat backup keadaan terkini dahulu, pulihkan dump ke **database baru** menggunakan pg_restore, verifikasi, lalu arahkan koneksi backend ke database hasil restore. Jangan menimpa/menghapus database produksi atau audit BPJS untuk rollback otomatis.

Validasi lokal: migrasi dua kali, delapan seed unik, lima login, semua kombinasi Phantom Checker, kegagalan simpan, disposisi lintas-role, dan penolakan keputusan staf diuji oleh `backend/tests/stability.integration.test.js`. Tes membuat database baru berawalan `jkn_prd_test_`; tidak memakai database produksi.

Startup image produksi menjalankan migrasi sebelum membuka port API dan mencetak hanya status, versi, serta basename backup. Backup disimpan dalam volume migration_backups pada /app/backups dengan permission0600. Hash akun yang tidak valid membuat migrasi gagal tertutup.

Pada deployment Portainer, isi kedua nilai bcrypt dengan pembungkus petik tunggal agar tanda dolar dipertahankan oleh pemrosesan environment Compose. Petik bukan bagian hash yang diterima aplikasi. Verifikasi format hash60 karakter dan login setelah redeploy tanpa mencetak nilainya. Perilaku interpolation ini juga didokumentasikan dalam [penjelasan pengelola Portainer](https://github.com/portainer/portainer/issues/12635). Jangan memasukkan hash nyata ke contoh/commit.
