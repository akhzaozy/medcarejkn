# ARSITEKTUR SISTEM JKN INTEGRITY INTELLIGENCE

## 1. Gambaran Besar Arsitektur

JKN Integrity Intelligence dirancang sebagai **decision-support system**
untuk membantu proses identifikasi awal dan pemeriksaan terhadap
indikasi fraud pada klaim JKN, dengan fokus MVP pada **Phantom
Billing**. Sistem tidak menetapkan fraud sebagai keputusan final dan
tidak menggantikan proses purifikasi maupun verifikasi klaim.

### 1.1 Filosofi Decision-Support System: Mengapa Bukan Black-Box Machine Learning?
Sistem ini menggunakan **Deterministic Evidence Reconciliation Engine** dan bukan *black-box machine learning* (seperti probabilitas neural network murni):
1. **Transparansi & Pembuktian Hukum (Defensible & Explainable)**: Berdasarkan regulasi penanganan kecurangan JKN (Permenkes No. 16/2019), klaim sengketa memerlukan rincian bukti fisik dan perbandingan item demi item, bukan sekadar skor kemungkinan acak.
2. **Rekonsiliasi Granular**: Sistem mengidentifikasi dokumen mana yang ada, dokumen mana yang hilang, dan berapa selisih uang riilnya (*evidence gap*).

### 1.2 Pembagian Peran: Sistem (Radar Triase) & Nakes (Keputusan Akhir)
1. **Sistem**: Menjadi radar pendeteksi dini, menghitung gap berkas, dan memetakan prioritas audit.
2. **Nakes / Dokter Auditor**: Melakukan audit klinis mendalam terhadap berkas rekam medis asli dan **menetapkan keputusan final** (`CONFIRMED`, `FALSE_POSITIVE`, atau `NEEDS_MORE_EVIDENCE`). Sistem tidak pernah menetapkan vonis hukum secara otomatis.

``` text
┌──────────────────────────────────────────────────────────────────────┐
│                         SUMBER DATA                                  │
│                                                                      │
│  Data Klaim      Data Pelayanan      Data Evidence      Data RME*     │
│  ──────────      ──────────────      ─────────────      ─────────    │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    DATA INGESTION / NORMALIZATION                     │
│                                                                      │
│  • Validasi struktur data                                            │
│  • Normalisasi identifier                                            │
│  • Mapping claim → claim item                                        │
│  • Mapping pelayanan → evidence                                     │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                   │
│                         PostgreSQL                                   │
│                                                                      │
│  Patient ─ Encounter ─ Claim ─ Claim Item ─ Evidence                  │
│                              │                │                      │
│                              └──────┬─────────┘                      │
│                                     │                                │
│                              Risk Signal                              │
│                                     │                                │
│                                   Case                                │
│                                     │                                │
│                           Review Outcome                              │
│                                     │                                │
│                                Audit Log                              │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    EVIDENCE RECONCILIATION                            │
│                                                                      │
│       Claim Item  ←────────────→  Supporting Evidence                │
│                                                                      │
│  Apakah evidence tersedia?                                           │
│  Apakah evidence dapat dikaitkan?                                    │
│  Berapa quantity yang didukung?                                      │
│  Apakah terdapat evidence gap?                                       │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       DECISION ENGINE                                │
│                                                                      │
│  Evidence Status                                                     │
│       │                                                              │
│       ├── SUPPORTED                                                   │
│       ├── PARTIAL                                                     │
│       ├── UNSUPPORTED                                                 │
│       └── UNAVAILABLE                                                 │
│                                                                      │
│  + Risk Signal                                                       │
│  + Evidence Gap                                                      │
│  + Pattern Information                                               │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         CASE ENGINE                                  │
│                                                                      │
│  Claim → Risk Signal → Case → Affected Claim Item → Review Focus     │
│                                                                      │
│  Priority: HIGH / MEDIUM / LOW                                       │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       REST API / BACKEND                              │
│                         Node.js + Express                            │
│                                                                      │
│  Dashboard API                                                       │
│  Case API                                                             │
│  Evidence API                                                        │
│  Review Outcome API                                                  │
│  Analysis API                                                        │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                     │
│                       React + Vite                                   │
│                                                                      │
│  Risk Overview                                                       │
│  Investigation Queue                                                  │
│  Claim Investigation                                                  │
│  Evidence Chain                                                       │
│  Reviewer Outcome                                                     │
└──────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         REVIEWER                                     │
│                                                                      │
│  Melihat evidence → memahami alasan → melakukan review → outcome     │
└──────────────────────────────────────────────────────────────────────┘

* Dalam MVP: synthetic/simulated data.
```

------------------------------------------------------------------------

## 2. Definisi Setiap Komponen

### 2.1 Data Source

**Data Source** adalah sumber informasi yang menjadi bahan analisis
sistem.

Dalam konteks proposal, sumber data dibagi menjadi:

#### 1. Data Klaim

Berisi informasi yang diajukan sebagai klaim, misalnya:

-   Claim ID
-   Patient ID
-   Provider ID
-   tanggal klaim
-   jenis pelayanan
-   jumlah pelayanan

**Fungsi:** menjadi objek utama yang akan diperiksa.

#### 2. Data Pelayanan

Berisi informasi mengenai pelayanan kesehatan yang diklaim, misalnya:

-   Encounter
-   Procedure
-   Diagnosis
-   Service
-   Quantity

**Fungsi:** digunakan untuk membandingkan apa yang **diklaim** dengan
apa yang memiliki **bukti pelayanan**.

#### 3. Evidence

Evidence adalah bukti yang digunakan sistem untuk memeriksa
keterdukungan suatu claim item.

Dalam MVP, evidence direpresentasikan secara sintetis, misalnya:

-   Evidence ID
-   Claim Item ID
-   Evidence Type
-   Availability
-   Match Status
-   Match Quantity

Poin pentingnya adalah sistem tidak hanya bertanya **"apakah claim
mencurigakan?"**, tetapi **"claim item mana yang memiliki atau tidak
memiliki supporting evidence?"**

#### 4. Data RME

RME/SATUSEHAT menjadi konteks interoperabilitas yang menjadi dasar
desain hubungan antara pelayanan dan klaim.

Dalam MVP, data tersebut disimulasikan. Prototype belum mengklaim adanya
integrasi production dengan SATUSEHAT atau BPJS Kesehatan.

------------------------------------------------------------------------

## 3. Data Ingestion & Normalization

Lapisan ini bertugas menerima dan menyiapkan data sebelum dianalisis.

``` text
Raw Data
   ↓
Validation
   ↓
Normalization
   ↓
Mapping
   ↓
Database
```

### Tugas utama

**Validation**\
Memeriksa apakah field wajib tersedia dan struktur data sesuai.

**Normalization**\
Menyamakan format dan penamaan data.

Contoh:

``` text
claim_id
ClaimID
CLAIM_ID
```

dinormalisasi menjadi:

``` text
claim_id
```

**Mapping**\
Menghubungkan:

``` text
Claim
   ↓
Claim Item
   ↓
Evidence
```

Tujuannya agar setiap bagian klaim dapat ditelusuri sampai bukti yang
terkait.

------------------------------------------------------------------------

## 4. PostgreSQL Data Layer

PostgreSQL menjadi pusat penyimpanan data aplikasi.

Struktur konseptual:

``` text
PATIENT
   │
   ▼
ENCOUNTER
   │
   ├──────────────► DIAGNOSIS
   │
   └──────────────► PROCEDURE
                         │
                         ▼
                       CLAIM
                         │
                         ▼
                    CLAIM ITEM
                         │
                         ▼
                  EVIDENCE LINK
                         │
                         ▼
                    RISK SIGNAL
                         │
                         ▼
                       CASE
                         │
                         ▼
                  REVIEW OUTCOME
                         │
                         ▼
                     AUDIT LOG
```

Relasi ini memungkinkan proses investigasi ditelusuri dari case ke
claim, dari claim ke item, lalu dari item ke evidence dan hasil review.

------------------------------------------------------------------------

## 5. Claim

**Claim** adalah entitas yang merepresentasikan satu pengajuan klaim.

Contoh pada prototype:

``` text
CLM-0025
```

Claim memiliki beberapa `claim_item`.

``` text
CLM-0025
│
├── CI-0025-1
└── CI-0025-2
```

Analisis dilakukan sampai tingkat item sehingga sistem dapat menunjukkan
bagian spesifik dari claim yang membutuhkan pemeriksaan.

------------------------------------------------------------------------

## 6. Claim Item

Claim item merupakan bagian individual dari sebuah klaim dan menjadi
salah satu komponen utama arsitektur.

Contoh:

``` text
Claim
CLM-0025
```

memiliki:

``` text
CI-0025-1
CI-0025-2
```

Setiap item memiliki quantity yang diklaim.

Contoh synthetic case:

``` text
CI-0025-1 → quantity 5
CI-0025-2 → quantity 5

Total claimed = 10
```

Setiap item kemudian direkonsiliasi dengan evidence.

------------------------------------------------------------------------

## 7. Evidence Reconciliation

**Evidence Reconciliation** adalah inti proses pemeriksaan awal.

Sistem membandingkan:

``` text
CLAIM ITEM
     │
     ▼
SUPPORTING EVIDENCE
     │
     ▼
MATCHING
```

Yang diperiksa:

### A. Evidence tersedia?

``` text
YES
NO
```

### B. Evidence cocok?

``` text
MATCHED
NOT_MATCHED
```

### C. Berapa quantity yang didukung?

Contoh:

``` text
Claimed quantity = 10
Evidence quantity = 7
```

Maka:

``` text
Evidence Gap = 10 - 7
             = 3
```

dan:

``` text
Coverage = 7 / 10 × 100%
         = 70%
```

### D. Financial Exposure (Potensi Kerugian Finansial)

$$\text{Exposure Amount} = \sum_{i=1}^n (\text{Evidence Gap}_i \times \text{Unit Price}_i)$$

### E. Rumus Metrik Evaluasi Model / Benchmark Machine Learning (NHIS Validation Set)

Pengujian akurasi algoritma deteksi terhadap data ground truth dievaluasi menggunakan metrik baku klasifikasi Machine Learning:

* **Accuracy**: $\frac{TP + TN}{TP + TN + FP + FN}$
* **Precision**: $\frac{TP}{TP + FP}$
* **Recall (Sensitivity)**: $\frac{TP}{TP + FN}$
* **F1-Score**: $2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$
* **Macro F1-Score**: Rata-rata F1 seluruh kelas fraud ($C = \{\text{No Fraud, Phantom Billing, Ghost Enrollee, Wrong Diagnosis}\}$).

------------------------------------------------------------------------

## 8. Evidence Status

Sistem menghasilkan empat kondisi utama.

### SUPPORTED

``` text
Claim = 10
Evidence = 10
```

Seluruh quantity yang diklaim memiliki supporting evidence.

### PARTIAL

``` text
Claim = 10
Evidence = 7
```

Sebagian quantity memiliki supporting evidence.

``` text
Gap = 3
```

### UNSUPPORTED

``` text
Claim = 10
Evidence = 0
```

Evidence tersedia untuk diperiksa, tetapi tidak mendukung quantity yang
diklaim.

Kondisi ini dapat menghasilkan risk signal untuk pemeriksaan lebih
lanjut.

### UNAVAILABLE

``` text
Claim = 10
Evidence = tidak tersedia
```

Kondisi ini **tidak boleh langsung dianggap fraud**.

``` text
UNAVAILABLE
      ↓
NO_CONCLUSION
```

Guardrail ini mencegah sistem mengubah ketiadaan data menjadi tuduhan
fraud.

------------------------------------------------------------------------

## 9. Decision Engine

Decision Engine merupakan komponen backend yang menerapkan aturan
analisis.

Aturan dasar prototype:

``` text
IF evidence unavailable
    → UNAVAILABLE
    → NO_CONCLUSION

ELSE IF supported quantity = claimed quantity
    → SUPPORTED

ELSE IF supported quantity > 0
    → PARTIAL

ELSE
    → UNSUPPORTED
```

Kemudian sistem dapat menghasilkan signal berdasarkan kondisi tersebut.

Untuk indikasi Phantom Billing:

``` text
Evidence available
        +
Supported quantity = 0
        +
Claim exists
        ↓
PHANTOM_BILLING SIGNAL
```

**Risk signal bukan keputusan final fraud.**

Keputusan akhir tetap berada pada reviewer.

------------------------------------------------------------------------

## 10. Risk Signal

Risk Signal merupakan hasil indikasi yang menunjukkan bahwa suatu claim
atau claim item membutuhkan perhatian lebih lanjut.

Contoh:

``` text
PHANTOM_BILLING
```

atau:

``` text
PATTERN_REVIEW
```

Risk signal tetap harus mempunyai konteks:

``` text
Signal
 ↓
Claim
 ↓
Claim Item
 ↓
Evidence
 ↓
Reason
```

Dengan demikian sistem tidak hanya menghasilkan:

> HIGH RISK

tetapi dapat menunjukkan alasan yang melatarbelakangi signal tersebut.

------------------------------------------------------------------------

## 11. Case Engine

Risk signal kemudian dikelompokkan menjadi **Case** yang digunakan dalam
proses investigation.

Contoh:

``` text
Risk Signal
PHANTOM_BILLING
       ↓
CASE-0025
       ↓
CLM-0025
```

Case menyimpan informasi seperti:

-   Case ID
-   Claim ID
-   Risk Type
-   Priority
-   Evidence Gap
-   Coverage
-   Status

Case menjadi unit kerja reviewer.

------------------------------------------------------------------------

## 12. Evidence Chain

Evidence Chain merupakan cara sistem memperlihatkan hubungan data kepada
reviewer.

Contoh:

``` text
CASE-0025
     │
     ▼
CLM-0025
     │
     ▼
CI-0025-1
     │
     ├── Claimed: 5
     ├── Evidence: NOT_MATCHED
     └── Supported: 0

     ▼
CI-0025-2
     │
     ├── Claimed: 5
     ├── Evidence: NOT_MATCHED
     └── Supported: 0
```

Kemudian sistem menghasilkan ringkasan:

``` text
Total claimed      = 10
Total supported    = 0
Evidence gap       = 10
Coverage           = 0%
```

Reviewer dapat melihat bagian spesifik yang menjadi dasar indikasi.

------------------------------------------------------------------------

## 13. Case Priority

Case diberikan prioritas untuk membantu menentukan urutan review.

Prototype menggunakan:

``` text
HIGH
MEDIUM
LOW
```

Contoh konseptual:

``` text
Evidence gap tinggi
+
coverage rendah
+
risk signal kuat
        ↓
HIGH
```

Nilai priority **bukan probabilitas bahwa pasien, dokter, atau fasilitas
kesehatan melakukan fraud**. Priority hanya digunakan untuk membantu
menentukan case mana yang perlu diperiksa terlebih dahulu.

------------------------------------------------------------------------

## 14. REST API / Backend

Backend menggunakan:

-   Node.js
-   Express.js

Backend menjadi penghubung antara frontend, database, dan decision
engine.

``` text
React
  │
  │ HTTP / JSON
  ▼
Express API
  │
  ├── Dashboard Service
  ├── Case Service
  ├── Evidence Service
  ├── Analysis Service
  └── Review Service
        │
        ▼
   PostgreSQL
```

Endpoint utama prototype:

``` text
GET  /api/health
GET  /api/dashboard
GET  /api/cases
GET  /api/cases/:caseId
GET  /api/cases/:caseId/evidence
POST /api/analysis/run
POST /api/cases/:caseId/outcome
```

------------------------------------------------------------------------

## 15. Frontend

Frontend menggunakan:

-   React
-   Vite
-   Lucide React

Frontend menyediakan interface untuk reviewer.

``` text
Dashboard
   │
   ├── Risk Overview
   ├── Investigation Queue
   ├── Claim Investigation
   ├── Evidence Chain
   └── Reviewer Outcome
```

------------------------------------------------------------------------

## 16. Risk Overview

Halaman pertama memberikan gambaran kondisi keseluruhan data yang sedang
dianalisis.

Informasi yang dapat ditampilkan:

``` text
Claims Analyzed
High-Priority Cases
No Conclusion

Evidence Status:
SUPPORTED
PARTIAL
UNSUPPORTED
UNAVAILABLE
```

Dalam MVP, angka dashboard berasal dari synthetic dataset dan **bukan
statistik nasional JKN**.

------------------------------------------------------------------------

## 17. Investigation Queue

Reviewer tidak perlu membuka semua claim satu per satu.

Sistem menyediakan daftar case:

``` text
┌──────────┬──────────┬─────────────────┬──────────┐
│ Case ID  │ Claim ID │ Risk Type       │ Priority │
├──────────┼──────────┼─────────────────┼──────────┤
│ CASE-0025│ CLM-0025 │ PHANTOM_BILLING │ HIGH     │
│ CASE-0033│ CLM-0033 │ ...             │ ...      │
│ CASE-0037│ CLM-0037 │ PATTERN_REVIEW  │ ...      │
└──────────┴──────────┴─────────────────┴──────────┘
```

Tujuannya adalah membantu reviewer menentukan case mana yang perlu
diperiksa lebih dahulu.

------------------------------------------------------------------------

## 18. Claim Investigation

Ketika reviewer membuka sebuah case:

``` text
CASE-0025
```

sistem menampilkan:

``` text
Case
   ↓
Claim
   ↓
Claim Items
   ↓
Evidence
   ↓
Risk Signal
```

Reviewer dapat mengetahui bagian spesifik yang menjadi dasar indikasi.

------------------------------------------------------------------------

## 19. Reviewer Outcome

Sistem tidak mengambil keputusan hukum atau administratif secara
otomatis.

Reviewer tetap menjadi pihak yang menentukan outcome.

Prototype menyediakan:

``` text
CONFIRMED
NOT CONFIRMED
NEEDS MORE EVIDENCE
FALSE POSITIVE
```

Reviewer juga dapat memberikan catatan.

Outcome tersebut kemudian disimpan sebagai bagian dari histori review.

------------------------------------------------------------------------

## 20. Audit Log

Tindakan penting dalam proses review dicatat.

Contoh:

``` text
Reviewer membuka CASE-0025
        ↓
Melihat evidence
        ↓
Mengubah status
        ↓
Menambahkan catatan
        ↓
Audit Log
```

Informasi yang dapat dicatat:

-   Timestamp
-   Actor
-   Action
-   Case ID
-   Previous Status
-   New Status
-   Note

Tujuannya menjaga **traceability** proses review.

------------------------------------------------------------------------

## 21. Teknologi yang Digunakan

  Teknologi        Peran
  ---------------- -----------------------------------
  React            Antarmuka dashboard
  Vite             Build dan development frontend
  Lucide React     Icon UI
  Node.js          Runtime backend
  Express.js       REST API
  PostgreSQL       Penyimpanan data relasional
  JavaScript       Decision Engine
  Docker Compose   Menjalankan komponen aplikasi
  Nginx            Web server/reverse proxy frontend
  JSON             Format pertukaran data API
  REST API         Komunikasi frontend--backend

------------------------------------------------------------------------

## 22. Arsitektur Deployment

Untuk prototype, deployment dibuat sederhana.

``` text
                         USER / REVIEWER
                                │
                                ▼
                     ┌────────────────────┐
                     │       Browser      │
                     └─────────┬──────────┘
                               │
                               ▼
                     ┌────────────────────┐
                     │  React + Vite App  │
                     │      Nginx         │
                     └─────────┬──────────┘
                               │
                         HTTP / REST
                               │
                               ▼
                     ┌────────────────────┐
                     │ Node.js + Express  │
                     │      Backend       │
                     └─────────┬──────────┘
                               │
                   ┌───────────┴───────────┐
                   │                       │
                   ▼                       ▼
          ┌─────────────────┐    ┌─────────────────┐
          │ Decision Engine │    │   PostgreSQL    │
          │  Rule-based     │    │    Database     │
          └─────────────────┘    └─────────────────┘
```

------------------------------------------------------------------------

## 23. Alur Data Lengkap

``` text
                    DATA KLAIM
                        │
                        ▼
                DATA NORMALIZATION
                        │
                        ▼
                   PostgreSQL
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
         CLAIM ITEM            EVIDENCE
              │                   │
              └─────────┬─────────┘
                        ▼
               EVIDENCE RECONCILIATION
                        │
                        ▼
                EVIDENCE STATUS
                        │
              ┌─────────┼──────────┐
              │         │          │
              ▼         ▼          ▼
          SUPPORTED   PARTIAL   UNSUPPORTED
              │         │          │
              │         │          ▼
              │         │    RISK SIGNAL
              │         │          │
              └─────────┴──────────┤
                                   ▼
                              CASE ENGINE
                                   │
                                   ▼
                            INVESTIGATION QUEUE
                                   │
                                   ▼
                            REVIEWER INVESTIGATION
                                   │
                         ┌─────────┴─────────┐
                         ▼                   ▼
                     Evidence            Context
                         │                   │
                         └─────────┬─────────┘
                                   ▼
                             REVIEW OUTCOME
                                   │
                                   ▼
                              AUDIT LOG
```

------------------------------------------------------------------------

## 24. Contoh Alur CASE-0025

Case ini digunakan sebagai contoh synthetic case pada prototype.

``` text
CLM-0025
   │
   ├── CI-0025-1
   │      Claimed = 5
   │      Supported = 0
   │
   └── CI-0025-2
          Claimed = 5
          Supported = 0
```

Total:

``` text
Claimed = 10
Supported = 0
Gap = 10
Coverage = 0%
```

Kemudian:

``` text
Evidence
   ↓
Available = YES
   ↓
Match = NOT_MATCHED
   ↓
Supported = 0
   ↓
UNSUPPORTED
   ↓
PHANTOM_BILLING SIGNAL
   ↓
CASE-0025
   ↓
HIGH PRIORITY
   ↓
REVIEWER
```

**HIGH bukan berarti sistem menyatakan fraud terbukti.** Artinya case
tersebut diprioritaskan untuk pemeriksaan.

------------------------------------------------------------------------

## 25. Contoh Alur CASE-0033

Case ini menjadi pembanding untuk membuktikan bahwa sistem tidak asal
menuduh.

``` text
CLM-0033
   │
   ▼
Claimed = 10
   │
   ▼
Evidence = UNAVAILABLE
   │
   ▼
Tidak dapat melakukan reconciliation
   │
   ▼
UNAVAILABLE
   │
   ▼
NO_CONCLUSION
```

Bukan:

``` text
UNAVAILABLE
     ↓
FRAUD
```

Dengan demikian sistem mempunyai batas keputusan yang jelas ketika bukti
belum tersedia.

------------------------------------------------------------------------

## 26. Contoh Alur CASE-0037

Untuk pattern-based signal:

``` text
CLM-0037
   ↓
Pattern information
   ↓
PATTERN_REVIEW
   ↓
Investigation Queue
   ↓
Human Review
```

Pattern signal tidak otomatis diubah menjadi Phantom Billing. Sistem
memisahkan indikasi berbasis pola dari indikasi yang berasal dari
evidence reconciliation.

------------------------------------------------------------------------

## 27. Batasan Arsitektur

Sistem JKN Integrity Intelligence pada tahap prototype merupakan sistem
pendukung keputusan untuk membantu proses triase dan penelusuran awal
terhadap indikasi fraud. Sistem tidak menetapkan fraud sebagai keputusan
final, tidak menggantikan proses purifikasi maupun verifikasi klaim, dan
tidak mengklaim bahwa seluruh data yang digunakan berasal dari sistem
produksi JKN.

Prototype menggunakan **synthetic/simulated data** untuk pengembangan
dan demonstrasi. Struktur data dirancang dengan mempertimbangkan
hubungan klaim, item klaim, pelayanan, encounter, evidence, dan hasil
review yang relevan dengan ekosistem interoperabilitas kesehatan.
Prototype belum merupakan integrasi production dengan BPJS Kesehatan
atau SATUSEHAT.

------------------------------------------------------------------------

## 28. Prinsip Utama Arsitektur

Prinsip yang menjadi dasar rancangan adalah:

``` text
UNAVAILABLE ≠ UNSUPPORTED
UNSUPPORTED ≠ PROVEN FRAUD
RISK SIGNAL ≠ FINAL DECISION
```

Artinya:

1.  **Evidence tidak tersedia** tidak otomatis berarti layanan tidak
    dilakukan.
2.  **Evidence tersedia tetapi tidak mendukung klaim** dapat menjadi
    indikasi yang perlu diperiksa.
3.  **Risk signal** hanya membantu memprioritaskan pemeriksaan.
4.  **Reviewer manusia** tetap menentukan outcome.
5.  Seluruh proses harus dapat ditelusuri melalui **evidence chain** dan
    **audit log**.

------------------------------------------------------------------------

## 29. Inti Arsitektur dalam Satu Alur

``` text
Claim
  ↓
Claim Item
  ↓
Evidence
  ↓
Reconciliation
  ↓
Evidence Gap
  ↓
Risk Signal
  ↓
Case
  ↓
Evidence Chain
  ↓
Human Review
  ↓
Outcome
  ↓
Audit Trail
```

### Definisi sederhana

> **JKN Integrity Intelligence mengambil data klaim dan bukti pelayanan,
> menghubungkan keduanya sampai level item klaim, menghitung kesenjangan
> antara layanan yang diklaim dan bukti yang tersedia, kemudian mengubah
> indikasi tersebut menjadi case yang dapat ditelusuri oleh reviewer
> sebelum keputusan akhir dibuat oleh manusia.**
