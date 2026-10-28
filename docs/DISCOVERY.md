# Discovery — PRD stabilitas dan inovasi medCare JKN

Baseline: commit `19b235d`, 29 Oktober 2026. Spesifikasi pengguna: `perbaikan bug & penambahan inovasi.md` versi 1.0. Penelusuran awal tidak mengubah perilaku aplikasi.

## Lingkungan dan sumber

React 18/Vite di `frontend`, Express/pg di `backend`, DDL di `database/schema.sql`, data demo frontend di `frontend/src/api/mockData.js`. Jalur BPJS menggunakan indeks SQLite baca saja dan database audit terpisah; migrasi PostgreSQL tidak mengakses keduanya. Baseline direkam dalam `docs/execution/discovery-baseline.json` melalui `node scripts/diagnostics/reproduce-prd.mjs` sebelum perubahan.

## Pemetaan temuan dan reproduksi

| ID | Simbol bundle → sumber | Bukti baseline |
|---|---|---|
| BUG-01 | uw/up → auditCheckClaim/generateMockAuditCheck; ClaimAuditInputPage | Pemanggilan render fraudType.toUpperCase pada keluaran fallback menghasilkan TypeError. Cabang simpan mengulang error database, bukan mengembalikan analisis. |
| BUG-02 | komponen antrean → CasesPage filters/loadCases/loadStats | Tiga pembatas PHANTOM_BILLING untuk dokter ditemukan di sumber. |
| BUG-03 | lw → fetchCaseEvidence; CaseDetailPage | Fallback mengirim claimItems, UI membaca items; dua bentuk kontrak berbeda. |
| BUG-04 | filter assigned → handleSwitchTab | Username dokter tertentu di-hardcode untuk staf. |
| BUG-05 | Di.find/Di[0] → getMockCaseDetails | ID tidak ada menghasilkan CASE-PB-001. |
| BUG-06 | Fn/s4 → caseService/dashboardService/client | Kegagalan API normal ditangkap menjadi sukses memori. DDL awal tidak idempoten; mount init hanya dijalankan PostgreSQL saat volume pertama dibuat. **Database lokal sudah memiliki tabel dan 4.336 kasus; tabel hilang tidak direproduksi lokal.** Deployment perlu preflight/migrasi aditif untuk volume lama, tanpa reset. |
| BUG-07 | nav-item-cases → App/MedcareHeader | Navbar menuju antrean BPJS, dashboard menuju CASE-PB. |
| BUG-08 | event renderer → CaseDetailPage | UI membaca created_at/actor_id, event demo memakai timestamp/actor. |
| BUG-09 | login → authController/loginUser/App | Respons role-only login menyertakan field password; role-only juga melewati pemeriksaan kredensial. Hanya boolean hasil yang direkam, tanpa nilai rahasia. |
| BUG-10 | ValidationPage / MedcareAuditScheduleModal | Halaman tersedia tetapi tanpa navigasi; state pembuka jadwal tidak pernah diaktifkan. |
| BUG-11 | MedcareHeader | Berkas avatar ada lokal: 404 belum direproduksi. Identitas visual tetap memakai foto tetap untuk semua user; avatar inisial dipilih untuk identitas per akun dan menghapus ketergantungan eksternal. |
| BUG-12 | .med-header / BpjsAuditPage resultAnchor | Header dua baris dan offset hasil tetap 100px tidak selaras; uji visual lanjutan menggunakan tinggi header aktual. |

Reproduksi kontrak/sumber dibedakan dari uji browser. Bukti browser dan matriks API tambahan dicatat pada laporan eksekusi; tidak mengklaim seluruh audit produksi sudah direproduksi.

## Asal metrik dan tipe mesin

`detectNhisFraud` berisi kondisi if/else dan angka confidence/skor tetap, tanpa model terlatih. `validationService` menghitung confusion matrix dari dua CSV lokal dengan aturan tersebut, tanpa split independen yang terdokumentasi. Fallback `MOCK_VALIDATION` berisi metrik tetap. AUC 0,9688/F1 0,8588 dalam laporan audit tidak memiliki artefak evaluasi terverifikasi di deployment. Metrik lama tidak digunakan sebagai klaim performa. Implementasi berikutnya memakai rule engine yang dikonfigurasi serta laporan benchmark sintetis yang dapat diulang; ML/hybrid ditandai belum tersedia.

## Keputusan implementasi

- Staf memakai filter “Belum didisposisi”; dokter memakai username sesi dan semua mode risiko.
- Pertahankan status lama yang valid, tambahkan pemetaan OPEN→NEW untuk tampilan siklus; status BPJS tidak dimigrasikan.
- Bukti unggahan tahap ini berupa metadata terstruktur/referensi, bukan OCR atau verifikasi isi berkas.
- Modal klarifikasi dipakai dan dicatat secara persisten.
- Tidak ada LLM pada scoring/copilot; draf berbasis templat bersumber pada aturan.
- Fase 6 hanya diimplementasikan setelah verifikasi variabel agregat; Fase 7 memakai urutan prioritas transparan, tanpa skor probabilitas rekaan.
