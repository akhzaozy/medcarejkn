# Benchmark aturan yang dapat diulang

Dari root repo: `node scripts/evaluate/run.mjs` (Node 22.13+). Tidak membutuhkan paket ML atau layanan LLM. Keluaran: `data/benchmark/synthetic.json` dan `validation_report.json`. Hash dataset, prediksi, split, metrik, dan interval bootstrap deterministik dengan seed 29102026; hanya evaluatedAt berubah saat dijalankan ulang.

Label dibuat dari skenario laten sintetis, bukan label fraud JKN. Grup unik diacak dan dipisah 70/30 sebelum scoring; input scoring hanya `features`, tidak mencakup label, ID, groupId, atau scenario. Tidak ada model terlatih maupun preprocessing yang di-fit; trainSize adalah bagian yang dicadangkan, trainingUsed=false. ML-only/hybrid belum tersedia, tidak diberi angka rekaan.

Skor aturan 0–100 dan kontribusinya mengikuti config/risk_rules.json. Nol tagihan dan bukti yang belum tersedia tidak otomatis positif. PR-AUC memakai integral trapezoidal kurva precision–recall dengan pengelompokan skor sama; ROC-AUC juga mengelompokkan ties. Precision@K memakai urutan skor lalu ID, tanpa label untuk pemecah seri. CI percentile dihitung dari 200 bootstrap berseed. Jangan menafsirkan metrik ini sebagai probabilitas/akurasi fraud dunia nyata.
