# AUDIT MATRIKS TOMBOL, KONTROL, DAN FITUR INTERAKTIF MEDCAREJKN

Dokumen ini merupakan hasil inventarisasi dan verifikasi operasional terhadap seluruh tombol, kontrol input, formulir, dan elemen interaktif di seluruh halaman aplikasi **medCareJKN** berdasarkan implementasi 3 fokus utama per **30 Oktober 2026**.

---

## 1. METODOLOGI & STATUS PENGUJIAN

Untuk menjaga kejujuran teknis, status pengujian pada dokumen ini diklasifikasikan ke dalam 4 kategori:
- **`Passed (Runtime Verified)`**: Telah diuji dan dibuktikan berfungsi normal pada waktu-jalan (*runtime execution*) melalui Playwright browser test suite, pemanggilan API HTTP langsung, atau automated integration test.
- **`Passed (Code Inspected)`**: Telah diperiksa secara mendalam melalui penelusuran struktur kode React JSX, event handler, dan middleware Express.
- **`Blocked / Disabled (Runtime Verified)`**: Kontrol atau rute yang sengaja dinonaktifkan / diblokir dengan HTTP 403 pada lingkungan operasional 3 fokus utama.
- **`Not Tested (Runtime)`**: Fitur atau kontrol yang belum dieksekusi secara interaktif pada runtime saat audit berlangsung.

---

## 2. INVENTARISASI HEADER & NAVIGASI UTAMA (`MedcareHeader.jsx`)

Pada baseline terbaru 3 fokus utama, bilah navigasi atas disederhanakan menjadi **4 menu operasional terpadu**:

| ID / Nama Kontrol | Jenis Kontrol | Target Halaman / Aksi | Otorisasi Peran | Status Uji | Keterangan & Batasan |
|---|---|---|---|---|---|
| `.med-logo` | Button / Logo | Navigasi ke Beranda (`landing`) | Semua | **Passed (Runtime Verified)** | Navigasi SPA tanpa reload peramban. |
| `nav-item-landing` | Nav Pill | Buka Beranda / Dashboard (`landing`) | Semua | **Passed (Runtime Verified)** | Menampilkan metrik KPI dan kartu audit prioritas. |
| `nav-item-cases` | Nav Pill | Buka Antrean Kasus Klaim (`cases`) | Semua | **Passed (Runtime Verified)** | Menampilkan tabel antrean kasus dengan filter 3 fokus. |
| `nav-item-input` | Nav Pill | Buka Uji Klaim Manual (`input`) | Semua | **Passed (Runtime Verified)** | Formulir interaktif audit 4 mode deteksi instan. |
| `nav-item-guide` | Nav Pill | Buka Panduan Regulasi (`guide`) | Semua | **Passed (Runtime Verified)** | Referensi pedoman audit, kamus data, dan regulasi JKN. |
| `#btn-navbar-notifications` | Button Icon | Buka/Tutup Popover Notifikasi | Semua | **Passed (Runtime Verified)** | Lencana unread diperbarui via polling 15s dan fetch on-demand saat diklik. |
| `btn-mark-all-read` | Button Text | Tandai Semua Notifikasi Dibaca | Semua | **Passed (Runtime Verified)** | Memanggil `POST /api/notifications/read-all`, mereset unread badge menjadi 0. |
| `.notif-item-card` | List Card Click| Buka Berkas Kasus Terkait | Semua | **Passed (Runtime Verified)** | Menandai notifikasi dibaca via `POST /api/notifications/:id/read` dan membuka detail kasus. |
| `#btn-logout` | Button Icon | Keluar dari Sesi (`logoutUser`)| Semua | **Passed (Runtime Verified)** | Menghapus token Bearer JWT dari sesi, kembali ke `LoginPage`. |
| *(Menu Data BPJS)* | *(Dihapus dari Header)* | Pratinjau dataset sampel BPJS lama | *(Non-aktif)* | **Blocked / Disabled (Runtime Verified)** | Rute API `/api/bpjs/*` diblokir mengembalikan HTTP 403 `FORBIDDEN_LEGACY_MODULE`. |
| *(Menu AI & Validasi)* | *(Dihapus dari Header)* | Evaluasi benchmark aturan lama | *(Non-aktif)* | **Blocked / Disabled (Runtime Verified)** | Rute API `/api/validation/*` dan `/api/analysis/*` diblokir mengembalikan HTTP 403 `FORBIDDEN_LEGACY_MODULE`. |

---

## 3. INVENTARISASI DASHBOARD UTAMA (`MedcareLanding.jsx`)

| ID / Nama Kontrol | Jenis Kontrol | Target Halaman / Aksi | Otorisasi Peran | Status Uji | Penanganan Error & Batasan |
|---|---|---|---|---|---|
| `kpi-card-total-claims`| Card Clickable | Buka Antrean filter `ALL` | Semua | **Passed (Runtime Verified)** | Agregasi data dihitung dari tabel `cases`. |
| `kpi-card-high-priority`| Card Clickable| Buka Antrean filter `priority=HIGH`| Semua | **Passed (Runtime Verified)** | Menyaring kasus dengan skor risiko $\ge 60$. |
| `kpi-card-completed` | Card Clickable | Buka Antrean filter `COMPLETED` | Semua | **Passed (Runtime Verified)** | Menyaring status `CONFIRMED`, `NOT_CONFIRMED`, `CLOSED`. |
| `kpi-card-unassigned` | Card Clickable | Buka Antrean filter `UNASSIGNED` | Staff JKN | **Passed (Runtime Verified)** | Menyaring kasus dengan `assigned_to IS NULL`. |
| `btn-open-priority-case`| Button Action | Buka Detail Kasus Prioritas | Semua | **Passed (Runtime Verified)** | Membuka berkas kasus prioritas pertama langsung ke `CaseDetailPage`. |
| `chart-range-toggle` | Tab Buttons | Ganti rentang waktu grafik tren | Semua | **Passed (Code Inspected)** | Memfilter visualisasi tren per 6 bulan / 1 tahun. |

---

## 4. INVENTARISASI ANTREAN KASUS KLAIM (`CasesPage.jsx`)

| ID / Nama Kontrol | Jenis Kontrol | Target Halaman / Aksi | Otorisasi Peran | Status Uji | Penanganan Error & Batasan |
|---|---|---|---|---|---|
| `input-case-search` | Input Text | Cari No. Klaim, Nama RS, atau ID Kasus | Semua | **Passed (Runtime Verified)** | Server-side `ILIKE` query dengan mekanisme debounce. |
| `filter-status-pills` | Button Pills | Filter status (`ALL`, `OPEN`, `IN_REVIEW`, `CONFIRMED`, dll) | Semua | **Passed (Runtime Verified)** | Query parameter `status`. |
| `select-assigned-to` | Dropdown Select | Filter reviewer dokter | Semua | **Passed (Runtime Verified)** | Pada dokter penelaah, backend membatasi kasus sesuai username dokter aktif. |
| `select-priority` | Dropdown Select | Filter `HIGH`, `MEDIUM`, `LOW`, `NO_CONCLUSION` | Semua | **Passed (Runtime Verified)** | Query parameter `priority`. |
| `select-risk-mode` | Dropdown Select | Filter 3 Fokus (`FOCUS`, `PHANTOM_BILLING`, `UPCODING`, `EVIDENCE_REVIEW`, `UNAVAILABLE`) | Semua | **Passed (Runtime Verified)** | Filter `FOCUS` mencakup `PHANTOM_BILLING`, `UPCODING`, `EVIDENCE_REVIEW`, dan `UNAVAILABLE`. Kasus `PATTERN_REVIEW` secara tepat disaring keluar. |
| `table-case-row` | Table Row Click| Buka Detail Kasus | Semua | **Passed (Runtime Verified)** | Memanggil `onSelectCase(caseId)` membuka `CaseDetailPage`. |
| `pagination-prev-next`| Buttons Nav | Paginasi tabel kasus | Semua | **Passed (Runtime Verified)** | Server-side pagination (`LIMIT` dan `OFFSET`). |

---

## 5. INVENTARISASI DETAIL BERKAS KASUS (`CaseDetailPage.jsx`)

Halaman `CaseDetailPage.jsx` menggunakan format **halaman audit tunggal sekuensial (single-page sequential view)** yang terbagi ke dalam 8 seksi utama:

| Seksi Halaman | Kontrol / Input | Fungsi & Target Aksi | Otorisasi Peran | Status Uji |
|---|---|---|---|---|
| **Seksi 1: Lifecycle Stepper** | Stepper Bar | Visualisasi tahapan kasus (Klaim $\rightarrow$ Deteksi Anomali $\rightarrow$ Penugasan $\rightarrow$ Telaah Klinis $\rightarrow$ Rekonsiliasi) | Semua | **Passed (Runtime Verified)** |
| **Seksi 2: Case Header Card** | Tombol Kembali (`btn-back-queue`) | Kembali ke antrean kasus klaim | Semua | **Passed (Runtime Verified)** |
| **Seksi 3: Executive Summary** | Metrik Indikator | Menampilkan Diagnosis ICD-10, Prosedur ICD-9, Total Klaim, Skor Risiko Aturan, dan Rasio Bukti | Semua | **Passed (Runtime Verified)** |
| **Seksi 4: Side-by-Side View** | Komparasi Tagihan vs Bukti | Perbandingan butir klaim tertagih vs rekam medis terverifikasi | Semua | **Passed (Runtime Verified)** |
| **Seksi 5: Panduan Dokter** | Card Panduan Medis | Pedoman telaah khusus untuk peran dokter spesialis | Dokter Penelaah | **Passed (Runtime Verified)** |
| **Seksi 6: Evidence Chain** | Form Unggah Bukti (`form-upload-evidence`) | Unggah dokumen bukti pendukung (PDF/JPG/PNG/DICOM $\le$ 10 MB) dan tautkan ke butir tindakan | Staff & Dokter | **Passed (Runtime Verified)** |
| **Seksi 7: Claim Items Table** | Tabel Butir Tindakan | Menampilkan status per butir (`SUPPORTED`, `UNAVAILABLE`, `PARTIAL`), kuantitas tagih, dan kuantitas terdukung | Semua | **Passed (Runtime Verified)** |
| **Seksi 7B: Dispute Trail** | Form Sanggahan (`form-submit-dispute`) | Input nomor surat, argumentasi sengketa, dan lampiran surat faskes (mengubah status ke `RECONCILIATION`) | `staff_jkn` (Dilindungi Route, Service, & UI) | **Passed (Runtime Verified)** |
| **Seksi 8: Panel Aksi Staff** | Dropdown & Tombol Penugasan (`btn-assign-doctor`) | Pilih dokter penelaah (`dr.anindya`, `dr.budi`, `dr.ratna`), simpan penugasan (mengubah status ke `IN_REVIEW`) | `staff_jkn` (`requireRole('staff_jkn')`) | **Passed (Runtime Verified)** |
| **Seksi 8: Panel Aksi Dokter** | 4 Kartu Review Outcome | Pilih `CONFIRMED`, `NOT_CONFIRMED`, `FALSE_POSITIVE`, atau `NEEDS_MORE_EVIDENCE` | `clinical_reviewer` (`requireRole('clinical_reviewer')`) | **Passed (Runtime Verified)** |
| **Seksi 8: Panel Aksi Dokter** | Textarea Catatan Klinis | Masukkan pertimbangan medis dokter (tersedia tombol draf otomatis) | `clinical_reviewer` | **Passed (Runtime Verified)** |
| **Seksi 8: Panel Aksi Dokter** | Tombol Simpan Putusan (`btn-submit-outcome`) | Simpan hasil telaah medis ke PostgreSQL (`review_outcomes`) dan terbitkan notifikasi ke staf | `clinical_reviewer` | **Passed (Runtime Verified)** |
| **Seksi 8: Umpan Balik AI** | Form Rating AI (`btn-save-ai-feedback`) | Rekam persetujuan / ketidaksetujuan terhadap rekomendasi ke tabel `ai_feedback` | `clinical_reviewer` | **Passed (Runtime Verified)** |
| **Seksi 8: Audit Trail** | Linimasa Peristiwa | Linimasa kronologis seluruh riwayat aksi pada tabel `audit_logs` | Semua | **Passed (Runtime Verified)** |

---

## 6. INVENTARISASI UJI KLAIM MANUAL (`ClaimAuditInputPage.jsx`)

Formulir uji klaim manual memungkinkan simulasi penapisan risiko instan dengan 4 pilihan mode audit deterministik:

| ID / Nama Kontrol | Jenis Kontrol | Target Halaman / Aksi | Otorisasi Peran | Status Uji | Karakteristik & Perilaku Runtime |
|---|---|---|---|---|---|
| `mode-all` | Radio / Button Mode | Pilih Mode Deteksi: **ALL** | Semua | **Passed (Runtime Verified)** | Mengevaluasi seluruh aturan (PB-01 dan UC-01 dapat terpicu bersamaan, total skor hingga 100). |
| `mode-pb` | Radio / Button Mode | Pilih Mode Deteksi: **PHANTOM_BILLING** | Semua | **Passed (Runtime Verified)** | Mengisolasi evaluasi hanya pada aturan `PB-01`. Aturan UC-01 diabaikan dari skor (skor 65). |
| `mode-uc` | Radio / Button Mode | Pilih Mode Deteksi: **UPCODING** | Semua | **Passed (Runtime Verified)** | Mengisolasi evaluasi hanya pada aturan `UC-01`. Menghitung disparitas tarif terhadap tarif acuan INA-CBG (skor 35). |
| `mode-er` | Radio / Button Mode | Pilih Mode Deteksi: **EVIDENCE_REVIEW** | Semua | **Passed (Runtime Verified)** | Menjalankan rekonsiliasi deterministik `reconcileItem()`. Memberikan status kecocokan tanpa menambah skor fraud (skor 0). |
| `preset-phantom` | Button Preset | Isi formulir skenario Phantom Billing | Semua | **Passed (Runtime Verified)** | Mengisi klaim kuantitas 5 dengan bukti terdukung 1 (selisih gap 4). |
| `preset-upcoding` | Button Preset | Isi formulir skenario Upcoding | Semua | **Passed (Runtime Verified)** | Mengisi nominal tagihan Rp15.600.000 dengan tarif acuan Rp6.000.000 (selisih Rp9.600.000). |
| `preset-evidence-gap`| Button Preset | Isi formulir skenario Kesenjangan Bukti | Semua | **Passed (Runtime Verified)** | Mengisi skenario uji kesenjangan berkas rekam medis. |
| `checkbox-evidence-avail` | Checkbox | Toggle Ketersediaan Bukti Medis | Semua | **Passed (Runtime Verified)** | Jika dicentang false (`evidenceAvailable === false`), sistem menghasilkan `reviewPriority = 'NO_CONCLUSION'`, `primary_risk_mode = 'UNAVAILABLE'`, skor 0, tanpa memicu vonis fraud otomatis. |
| `toggle-save-case` | Checkbox Toggle | Opsi "Simpan sebagai berkas kasus" | Semua | **Passed (Runtime Verified)** | Jika dicentang, berkas disimpan ke tabel `cases` PostgreSQL dengan status `OPEN`. |
| `btn-run-audit` | Button Submit | Tombol: *"Audit & Cek Kategori Klaim Sekarang"* | Semua | **Passed (Runtime Verified)** | Memanggil `POST /api/claims/audit-check` dan menyajikan kartu hasil penapisan risiko seketika. |

---

## 7. MATRIKS VERIFIKASI PEMBLOKIRAN ENDPOINT NON-FOKUS LEGACY

| Endpoint API Legacy | Metode HTTP | Ekspektasi Respons | Hasil Verifikasi Runtime | Dampak Keamanan & Operasional |
|---|---|---|---|---|
| `/api/bpjs/catalog` | GET | HTTP 403 `FORBIDDEN_LEGACY_MODULE` | **Passed (Runtime Verified)** | Mencegah akses ke modul katalog BPJS non-target. |
| `/api/bpjs/patients` | GET | HTTP 403 `FORBIDDEN_LEGACY_MODULE` | **Passed (Runtime Verified)** | Mencegah pembacaan data pasien kohort lama. |
| `/api/validation` | GET | HTTP 403 `FORBIDDEN_LEGACY_MODULE` | **Passed (Runtime Verified)** | Memblokir pratinjau evaluasi benchmark non-target. |
| `/api/analysis/run` | POST | HTTP 403 `FORBIDDEN_LEGACY_MODULE` | **Passed (Runtime Verified)** | Memblokir mesin analisis agregat pola lama. |
| `/api/analysis/summary` | GET | HTTP 403 `FORBIDDEN_LEGACY_MODULE` | **Passed (Runtime Verified)** | Memblokir ringkasan data analisis legacy. |
