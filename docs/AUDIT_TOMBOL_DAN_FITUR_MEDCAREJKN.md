# AUDIT MATRIKS TOMBOL, KONTROL, DAN FITUR INTERAKTIF MEDCAREJKN

Dokumen ini merupakan hasil inventarisasi dan verifikasi operasional terhadap seluruh tombol, kontrol input, *dropdown*, dan elemen interaktif di seluruh halaman aplikasi **medCareJKN** berdasarkan kode sumber aktif di `D:\medcare`.

---

## 1. METODOLOGI & STATUS PENGUJIAN

Untuk menjaga kejujuran teknis, status pengujian pada dokumen ini diklasifikasikan ke dalam 4 kategori:
- **`Passed (Runtime Verified)`**: Telah diuji dan dibuktikan berfungsi normal pada pengujian waktu-jalan (*runtime execution*) melalui peramban web, panggilan API HTTP, atau automated integration test.
- **`Passed (Code Inspected)`**: Telah diperiksa secara saksama melalui penelusuran kode React JSX, handler event, dan middleware Express, serta dipastikan strukturnya valid dan konsisten.
- **`Not Tested (Runtime)`**: Fitur atau kontrol yang belum dieksekusi secara interaktif pada runtime saat audit berlangsung.
- **`Conceptual / External`**: Elemen yang merepresentasikan alur bisnis luar atau proses yang belum memiliki komponen antarmuka independen.

---

## 2. INVENTARISASI HEADER & NAVIGASI UTAMA (`MedcareHeader.jsx`)

| ID / Nama Kontrol | Jenis Kontrol | Target Halaman / Aksi | Otorisasi Peran | Status Uji | Penanganan Error & Batasan |
|---|---|---|---|---|---|
| `.med-logo` | Button / Clickable | Navigasi ke Dashboard (`landing`) | Semua | **Passed (Runtime Verified)** | Mengubah state halaman aktif tanpa me-reload peramban. |
| `nav-item-landing` | Nav Pill | Buka Dashboard | Semua | **Passed (Runtime Verified)** | Pill aktif beranimasi layout Spring. |
| `nav-item-cases` | Nav Pill | Buka Antrean Kasus Klaim (`cases`) | Semua | **Passed (Runtime Verified)** | Menampilkan tabel antrean kasus. |
| `nav-item-input` | Nav Pill | Buka Audit Pasien BPJS (`input`) | Semua | **Passed (Runtime Verified)** | Form kalkulator audit instan. |
| `nav-item-bpjs` | Nav Pill | Buka Data BPJS (`bpjs`) | Semua | **Passed (Runtime Verified)** | Pratinjau dataset sampel kohort 2025. |
| `nav-item-validation`| Nav Pill | Buka AI & Validasi (`validation`)| Semua | **Passed (Runtime Verified)** | Evaluasi benchmark aturan sintetis. |
| `nav-item-guide` | Nav Pill | Buka Panduan (`guide`) | Semua | **Passed (Runtime Verified)** | Dokumentasi regulasi & kamus data. |
| `#btn-navbar-notifications` | Button Icon | Buka/Tutup Popover Notifikasi | Semua | **Passed (Runtime Verified)** | Menampilkan badge unread; memicu `fetchNotifications()` saat diklik; polling otomatis tiap 15s. |
| `btn-mark-all-read` | Button Text | Tandai Semua Notifikasi Dibaca | Semua | **Passed (Runtime Verified)** | Memanggil `POST /api/notifications/read-all`, mereset unread badge menjadi 0. |
| `.notif-item-card` | List Card Click| Buka Berkas Kasus Terkait | Semua | **Passed (Runtime Verified)** | Menandai satu notifikasi terbaca via `POST /api/notifications/:id/read` dan membuka detail kasus. |
| `#btn-logout` | Button Icon | Keluar dari Sesi (`logoutUser`)| Semua | **Passed (Runtime Verified)** | Menghapus token JWT, menghapus sesi di `auth_sessions`, kembali ke `LoginPage`. |

---

## 3. INVENTARISASI DASHBOARD UTAMA (`MedcareLanding.jsx`)

| ID / Nama Kontrol | Jenis Kontrol | Target Halaman / Aksi | Otorisasi Peran | Status Uji | Penanganan Error & Batasan |
|---|---|---|---|---|---|
| `kpi-card-total-claims`| Card Clickable | Buka Antrean filter `ALL` | Semua | **Passed (Runtime Verified)** | Agregasi data dihitung dari tabel `cases`. |
| `kpi-card-high-priority`| Card Clickable| Buka Antrean filter `priority=HIGH`| Semua | **Passed (Runtime Verified)** | Menyaring kasus dengan skor risiko $\ge 60$. |
| `kpi-card-completed` | Card Clickable | Buka Antrean filter `COMPLETED` | Semua | **Passed (Runtime Verified)** | Menyaring status `CONFIRMED`, `NOT_CONFIRMED`, `CLOSED`. |
| `kpi-card-unassigned` | Card Clickable | Buka Antrean filter `UNASSIGNED` | Staff JKN | **Passed (Runtime Verified)** | Menyaring kasus dengan `assigned_to IS NULL`. |
| `btn-open-priority-case`| Button Action | Buka Detail Kasus Prioritas | Semua | **Passed (Runtime Verified)** | Kontras teks telah disempurnakan (teks gelap `#0f172a` di atas kartu terang). |
| `chart-range-toggle` | Tab Buttons | Ganti rentang waktu grafik tren | Semua | **Passed (Code Inspected)** | Memfilter data grafik per 6 bulan / 1 tahun. |

---

## 4. INVENTARISASI ANTREAN KASUS KLAIM (`CasesPage.jsx`)

| ID / Nama Kontrol | Jenis Kontrol | Target Halaman / Aksi | Otorisasi Peran | Status Uji | Penanganan Error & Batasan |
|---|---|---|---|---|---|
| `input-case-search` | Input Text | Cari No. Klaim, Nama RS, atau ID Kasus | Semua | **Passed (Runtime Verified)** | Server-side `ILIKE` query dengan debounce. |
| `filter-status-pills` | Button Pills | Filter status (`ALL`, `OPEN`, `IN_REVIEW`, `CONFIRMED`, dll) | Semua | **Passed (Runtime Verified)** | Query parameter `status`. |
| `select-assigned-to` | Dropdown Select | Filter reviewer dokter | Semua | **Passed (Runtime Verified)** | Pada role dokter penelaah, backend secara paksa mengunci filter pada kasus dirinya (`req.user.username`). |
| `select-priority` | Dropdown Select | Filter `HIGH`, `MEDIUM`, `LOW`, `NO_CONCLUSION` | Semua | **Passed (Runtime Verified)** | Query parameter `priority`. |
| `select-risk-mode` | Dropdown Select | Filter modus (`PHANTOM_BILLING`, `UPCODING`, dll) | Semua | **Passed (Runtime Verified)** | Query parameter `riskMode`. |
| `table-case-row` | Table Row Click| Buka Detail Kasus | Semua | **Passed (Runtime Verified)** | Memanggil `onSelectCase(caseId)`. |
| `pagination-prev-next`| Buttons Nav | Paginasi tabel kasus | Semua | **Passed (Runtime Verified)** | Server-side pagination (`LIMIT` dan `OFFSET`). |

---

## 5. INVENTARISASI DETAIL BERKAS KASUS (`CaseDetailPage.jsx`)

> [!NOTE]
> **Klarifikasi Arsitektur Halaman:** Halaman `CaseDetailPage.jsx` menggunakan format **halaman audit tunggal sekuensial (single-page sequential view)** yang terbagi ke dalam 8 seksi utama, **bukan tab sub-menu terpisah**.

| Seksi Halaman | Kontrol / Input | Fungsi & Target Aksi | Otorisasi Peran | Status Uji |
|---|---|---|---|---|
| **Seksi 1: Lifecycle Stepper** | Stepper Bar | Visualisasi 5 tahapan kasus (Klaim $\rightarrow$ Anomali $\rightarrow$ Penugasan $\rightarrow$ Telaah $\rightarrow$ Rekonsiliasi) | Semua | **Passed (Runtime Verified)** |
| **Seksi 2: Case Header Card** | Tombol Kembali (`btn-back-queue`) | Kembali ke antrean kasus klaim | Semua | **Passed (Runtime Verified)** |
| **Seksi 3: Executive Summary** | Metrik Indikator | Menampilkan Diagnosis ICD-10, Prosedur ICD-9, Total Klaim, Skor Risiko Aturan, dan Persentase Bukti | Semua | **Passed (Runtime Verified)** |
| **Seksi 4: Side-by-Side View** | Komparasi Tagihan vs Bukti | Menampilkan perbandingan ringkas item klaim vs ketersediaan rekam medis | Semua | **Passed (Runtime Verified)** |
| **Seksi 5: Panduan Dokter** | Card Panduan Medis | Pedoman telaah khusus untuk peran dokter spesialis | Dokter Penelaah | **Passed (Code Inspected)** |
| **Seksi 6: Evidence Chain** | Form Unggah Bukti (`form-upload-evidence`) | Unggah file bukti pendukung (PDF/JPG/PNG/DICOM $\le$ 10 MB) dan tautkan ke butir tindakan | Staff & Dokter | **Passed (Runtime Verified)** |
| **Seksi 7: Claim Items Table** | Tabel Butir Tindakan | Menampilkan status per butir (`SUPPORTED`, `UNAVAILABLE`, `PARTIAL`), tarif, kuantitas tagih, dan kuantitas terdukung | Semua | **Passed (Runtime Verified)** |
| **Seksi 7B: Dispute Trail** | Form Sanggahan (`form-submit-dispute`) | Input nomor surat, argumentasi sengketa, dan lampiran surat faskes (mengubah status ke `RECONCILIATION`) | `staff_jkn` (Dilindungi di Route `requireRole`, Service *Defense-in-Depth*, dan UI) | **Passed (Runtime Verified)** |
| **Seksi 8: Panel Aksi Staff** | Dropdown & Tombol Penugasan (`btn-assign-doctor`) | Pilih dokter penelaah (`dr.anindya`, `dr.budi`, `dr.ratna`), simpan penugasan (mengubah status ke `IN_REVIEW`; mendukung status awal `ESCALATED` dan penggantian dokter) | `staff_jkn` (`requireRole('staff_jkn')`) | **Passed (Runtime Verified)** |
| **Seksi 8: Panel Aksi Dokter** | 4 Kartu Review Outcome | Pilih `CONFIRMED`, `NOT_CONFIRMED`, `FALSE_POSITIVE`, atau `NEEDS_MORE_EVIDENCE` | `clinical_reviewer` (`requireRole('clinical_reviewer')`) | **Passed (Runtime Verified)** |
| **Seksi 8: Panel Aksi Dokter** | Textarea Catatan Klinis | Masukkan pertimbangan medis dokter (tersedia tombol template draf otomatis) | `clinical_reviewer` | **Passed (Runtime Verified)** |
| **Seksi 8: Panel Aksi Dokter** | Tombol Simpan Putusan (`btn-submit-outcome`) | Simpan hasil telaah medis ke PostgreSQL (`review_outcomes`) dan terbitkan notifikasi ke staf | `clinical_reviewer` | **Passed (Runtime Verified)** |
| **Seksi 8: Umpan Balik AI** | Form Rating AI (`btn-save-ai-feedback`) | Rekam persetujuan / ketidaksetujuan terhadap saran aturan ke tabel `ai_feedback` | `clinical_reviewer` | **Passed (Runtime Verified)** |
| **Seksi 8: Audit Trail** | Linimasa Peristiwa | Menampilkan seluruh riwayat event kasus yang tercatat di tabel `audit_logs` | Semua | **Passed (Runtime Verified)** |

> [!NOTE]
> **Resolusi Temuan Keamanan Otorisasi Endpoint Dispute (SEC-01 — RESOLVED & VERIFIED):**
> 1. **Perlindungan Tingkat Route:** Endpoint `POST /api/cases/:caseId/dispute` pada [backend/src/routes/caseRoutes.js](file:///D:/medcare/backend/src/routes/caseRoutes.js#L18) dilindungi oleh middleware `requireSession` dan `requireRole('staff_jkn')`. Panggilan tanpa sesi ditolak dengan HTTP 401, dan panggilan dari role non-staf (`clinical_reviewer` atau role lainnya) ditolak dengan HTTP 403.
> 2. **Perlindungan Tingkat Service (*Defense in Depth*):** Pada [backend/src/services/caseService.js](file:///D:/medcare/backend/src/services/caseService.js#L368), method `recordCaseAction('dispute')` memvalidasi `actor?.role === 'staff_jkn'` mendahului pengecekan status kasus. Panggilan internal yang tidak sah ditolak dengan error status 403.
> 3. **Perlindungan `allowRevision`:** Role di luar `staff_jkn` diblokir langsung mendahului guard status final, sehingga parameter `allowRevision: true` tidak dapat disalahgunakan oleh dokter atau pihak luar untuk membuka kembali kasus final.
> 4. **Konsistensi UI:** Tombol aksi dan modal formulir sanggahan di `CaseDetailPage.jsx` hanya dirender untuk sesi `staff_jkn`. Seluruh 9 skenario keamanan diverifikasi lulus 100% pada suite pengujian otomatis `security.dispute.test.js`.

> [!NOTE]
> **Klarifikasi Aktor Sanggahan & Keterbatasan Penyimpanan:**
> - **Pihak yang Diwakili:** Faskes / Rumah Sakit (tidak memiliki login aplikasi independen).
> - **Pencatat Aktual:** Staff JKN yang sedang login memegang sesi aktif internal.
> - **Dokter Penelaah:** DPJP yang menelaah bukti sanggahan pada Seksi 7B.
> - **Keterbatasan Penyimpanan:** Frontend mengirimkan `role: 'Fasilitas Kesehatan (Rumah Sakit)'` dan `actor: 'Komite Medik...'`, namun kolom `actor` di `case_documents` dan `actor_id` di `audit_logs` menyimpan username staf pencatat. Fungsi backend `getCaseDetail` menimpa properti `actor` dengan username staf pencatat (`d.actor`), sehingga nama yang tampil di samping badge role `'Fasilitas Kesehatan (Rumah Sakit)'` adalah nama staf pencatat.

> [!NOTE]
> **Pembedaan Validasi Backend vs Panduan SOP pada Kasus `RECONCILIATION`:**
> Pada penyimpanan hasil telaah (`submitCaseOutcome`), backend hanya memvalidasi bahwa dokter yang memanggil adalah dokter yang ditugaskan, catatan telaah klinis tidak kosong, outcome valid, dan status kasus saat ini bukan status final (kasus berstatus final ditolak HTTP 409 tanpa pengecualian pemutakhiran langsung). Backend tidak memverifikasi secara teknis apakah dokumen sanggahan faskes atau bukti baru telah diperiksa oleh dokter. Penelaahan ulang bukti sanggahan sebelum menetapkan putusan adalah kepatuhan SOP medis, bukan validasi teknis backend.

> [!NOTE]
> **Pemetaan 3-Lapis Outcome Telaah Klinis:**
> - **4 Pilihan Kartu UI Form Dokter:** `CONFIRMED`, `NOT_CONFIRMED`, `NEEDS_MORE_EVIDENCE`, `FALSE_POSITIVE`.
> - **5 Nilai Diterima Backend API (`submitCaseOutcome`):** `CONFIRMED`, `NOT_CONFIRMED`, `NEEDS_MORE_EVIDENCE`, `FALSE_POSITIVE`, `ESCALATED`.
> - **Status Akhir pada Kolom `cases.case_status`:** `CONFIRMED` $\rightarrow$ `CONFIRMED`; `NEEDS_MORE_EVIDENCE` $\rightarrow$ `NEEDS_MORE_EVIDENCE`; `ESCALATED` $\rightarrow$ `ESCALATED`; sedangkan baik `NOT_CONFIRMED` maupun `FALSE_POSITIVE` sama-sama memutasi status akhir kasus menjadi **`NOT_CONFIRMED`** (lihat `caseService.js` baris 262-264). Nilai mentah `FALSE_POSITIVE` tetap dipertahankan pada tabel `review_outcomes`.
> - **Status `ESCALATED`:** `ESCALATED` didukung di backend API dan filter antrean `CasesPage.jsx`, namun tidak tersedia pada formulir UI dokter `CaseDetailPage.jsx`. Transisi lanjutan dari `ESCALATED` didukung secara struktural di kode backend, namun belum diuji runtime karena ketiadaan data uji `ESCALATED`.

---

## 6. INVENTARISASI AUDIT PASIEN BPJS (`ClaimAuditInputPage.jsx`)

| ID / Nama Kontrol | Jenis Kontrol | Target Halaman / Aksi | Otorisasi Peran | Status Uji |
|---|---|---|---|---|
| `btn-preset-phantom` | Button Preset | Isi formulir skenario Phantom Billing | Semua | **Passed (Runtime Verified)** |
| `btn-preset-unbundling`| Button Preset| Isi formulir skenario Pemecahan Tindakan | Semua | **Passed (Runtime Verified)** |
| `btn-preset-ineligible`| Button Preset| Isi formulir skenario Pasien Non-Aktif | Semua | **Passed (Runtime Verified)** |
| `toggle-save-case` | Checkbox Toggle| Opsi simpan hasil audit ke tabel `cases` | Semua | **Passed (Runtime Verified)** |
| `btn-run-audit` | Button Submit | Jalankan Evaluasi Rule Engine (`/claims/audit-check`)| Semua | **Passed (Runtime Verified)** |

---

## 7. INVENTARISASI DATA BPJS & VALIDASI

| Halaman | Kontrol / Elemen | Fungsi & Target Aksi | Status Uji |
|---|---|---|---|
| `BpjsDataPage` | `input-search-patient` | Pencarian pasien pada SQLite `bpjs-patients.sqlite` | **Passed (Runtime Verified)** |
| `BpjsDataPage` | `btn-download-preview` | Unduh pratinjau data sampel dalam format CSV | **Passed (Runtime Verified)** |
| `ValidationPage` | `chart-pr-roc` | Kurva Precision-Recall dan ROC pada 800 skenario sintetis | **Passed (Runtime Verified)** |
| `ValidationPage` | `tab-rule-config-log` | Pratinjau riwayat audit perubahan bobot aturan (`rule_config_log`) | **Passed (Runtime Verified)** |
