# Kelayakan Fase 6 — sebelum implementasi

Pemeriksaan `outputs/bpjs-2025/analysis.json` menemukan agregat bulanan dengan field nyata `tableId`, `cohort`, `kind`, `period` (YYYY-MM), `rows`, `billed`, `verified`, `billedCount`, `verifiedCount`. FKRTL menyediakan volume dan nilai tagih, sehingga baseline bulanan dalam kelompok sumber yang sama dapat dihitung tanpa join diagnosis.

Keputusan: implementasikan lonjakan volume/nilai dan perbandingan rata-rata tagih per baris berbiaya valid terhadap tiga bulan sebelumnya pada **tabel/cohort/jenis layanan yang sama**. Kelompok kontekstual tumpang tindih; tidak dijumlahkan menjadi peserta nasional unik dan tidak diperlakukan sebagai rumah sakit pembanding. Agregat ini tidak mendukung peer comparison per faskes, peta relasi, atau penilaian individu.

Metode: hanya gunakan tiga periode berurutan sebelum observasi (tidak memasukkan observasi saat ini); baseline median, skala robust = max(1.4826 × median absolute deviation, 10% median, 1). Flag jika kenaikan > 50% dan robust score > 3. Ketiadaan baseline/periode/angka valid dilewati dengan jumlah yang dilaporkan. Ambang adalah aturan eksplorasi yang dapat ditinjau, bukan ambang klinis atau keputusan fraud.

Setiap hasil wajib menampilkan tabel sumber, kohort, periode, metrik, nilai aktual, nilai baseline, periode pembanding, metode, dan rasio. Kasus dari pola agregat bertipe `pattern`, tidak mempunyai peserta/klaim individual dan tidak diberi skor risiko individual. Rujukan data sampel dan keterbatasan mengikuti katalog BPJS yang sudah ada.
