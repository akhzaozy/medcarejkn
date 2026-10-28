# Migrasi stabilitas (BUG-06 / BUG-09)

Jalankan `npm --prefix backend run migrate`. Skrip memakai konfigurasi PostgreSQL dari lingkungan, mengambil advisory lock, memeriksa ledger, membuat backup custom pg_dump dengan permission 0600, lalu menerapkan migrasi dan seed dalam satu transaksi. Tidak ada DROP/TRUNCATE/reset. Eksekusi kedua hanya memeriksa akun yang belum diinisialisasi; kasus/bukti/putusan yang sudah ada tidak ditimpa.

Backup berada di `JKN_BACKUP_DIR` atau `outputs/backups`. Backup, sesi, dan konfigurasi akun tidak boleh masuk Git. PostgreSQL dan SQLite audit BPJS terpisah; migrasi tidak membuka file audit BPJS.

Akun normal membutuhkan `JKN_STAFF_PASSWORD_HASH` dan `JKN_CLINICIAN_PASSWORD_HASH` (bcrypt). Isi melalui secret/environment deployment, jangan letakkan nilai nyata di Compose/Git. Akun yang sudah ada di `app_users` tidak direset. Tidak ada bypass role-only, password alternatif, atau password dalam respons. Sesi opaque disimpan sebagai SHA-256 di PostgreSQL, berlaku delapan jam, dan dicabut saat logout. UI menyimpan profil minimum; cache profil lama dibersihkan.

Rollback: hentikan container backend baru, kembali ke tag/commit aplikasi sebelumnya, dan pertahankan tabel aditif agar tidak menghilangkan data baru. Jika restore benar-benar diperlukan, buat backup keadaan terkini dahulu, pulihkan dump ke **database baru** menggunakan pg_restore, verifikasi, lalu arahkan koneksi backend ke database hasil restore. Jangan menimpa/menghapus database produksi atau audit BPJS untuk rollback otomatis.

Validasi lokal: migrasi dua kali, delapan seed unik, lima login, semua kombinasi Phantom Checker, kegagalan simpan, disposisi lintas-role, dan penolakan keputusan staf diuji oleh `backend/tests/stability.integration.test.js`. Tes membuat database baru berawalan `jkn_prd_test_`; tidak memakai database produksi.
