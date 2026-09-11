# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# JKN INTEGRITY INTELLIGENCE
## Phantom Billing Case Intelligence

**Version:** 1.0  
**Status:** Development Baseline / MVP  
**Scope:** Prototype / Competition Demo  
**Primary Category:** Efisiensi Risiko pada Fasilitas Kesehatan  
**Primary Risk Mode:** Phantom Billing  
**Tagline:** Detect the Gap. Trace the Evidence. Guide the Review.

---

## 1. Ringkasan Produk

JKN Integrity Intelligence adalah **case-level decision-support system** untuk membantu proses identifikasi awal dan pemeriksaan terhadap indikasi Phantom Billing pada klaim JKN.

Sistem bekerja dengan menghubungkan data klaim, item klaim, pelayanan, dan supporting evidence sampai tingkat item klaim. Sistem kemudian melakukan **evidence reconciliation**, menghasilkan status evidence, menghitung evidence gap, membentuk risk signal, menyusun case investigation, dan menyediakan ruang bagi reviewer manusia untuk menentukan outcome.

Prinsip utama:

```text
Claim
  ↓
Claim Item
  ↓
Evidence
  ↓
Reconciliation
  ↓
Evidence Status
  ↓
Evidence Gap
  ↓
Risk Signal
  ↓
Case
  ↓
Human Review
  ↓
Outcome
  ↓
Audit Trail
```

Sistem **bukan** mesin penentu fraud otomatis. Risk signal dan priority hanya membantu triase dan pemeriksaan. Final outcome tetap berada pada reviewer.

---

## 2. Tujuan Produk

### 2.1 Tujuan Utama

Menyediakan satu alur kerja yang dapat menunjukkan:

1. Klaim apa yang sedang diperiksa.
2. Claim item mana yang terdampak.
3. Evidence apa yang tersedia.
4. Apakah evidence mendukung quantity yang diklaim.
5. Berapa evidence gap yang terbentuk.
6. Mengapa sebuah case masuk antrean review.
7. Apa fokus pemeriksaan reviewer.
8. Apa outcome yang diberikan reviewer.
9. Bagaimana seluruh proses dapat ditelusuri kembali melalui audit trail.

### 2.2 Tujuan MVP

MVP harus mampu mendemonstrasikan setidaknya tiga kondisi penting:

- **Phantom Billing signal** ketika evidence tersedia tetapi tidak ada supporting evidence yang cocok terhadap quantity yang diklaim.
- **No Conclusion** ketika evidence tidak tersedia.
- **Pattern Review** ketika evidence mendukung claim tetapi terdapat signal berbasis pola yang tetap perlu ditinjau.

---

## 3. Batasan Produk

### 3.1 Dalam Scope MVP

- Synthetic dataset.
- PostgreSQL.
- Rule-based deterministic decision engine.
- Claim-level dan claim-item-level traceability.
- Evidence status.
- Evidence gap dan coverage.
- Risk signal.
- Case management sederhana.
- Investigation queue.
- Evidence chain.
- Reviewer outcome.
- Audit log.
- Dashboard ringkas.
- REST API.
- Docker Compose untuk environment aplikasi.

### 3.2 Di Luar Scope MVP

- Integrasi production langsung ke database BPJS Kesehatan.
- Integrasi production langsung ke SATUSEHAT.
- Akses atau pemrosesan data pasien JKN nyata.
- Keputusan hukum atau administratif otomatis.
- Automatic accusation terhadap pasien, dokter, atau fasilitas kesehatan.
- Model ML/GNN sebagai engine utama.
- Fraud probability yang diklaim sebagai probabilitas resmi.
- Perhitungan nominal kerugian nasional.
- Klaim accuracy model sebelum pengujian formal.

---

## 4. Pengguna Sistem

### 4.1 Reviewer / Investigator

Pengguna utama yang melakukan pemeriksaan case.

Kebutuhan:

- Melihat prioritas case.
- Membuka detail claim.
- Melihat claim item terdampak.
- Melihat evidence.
- Memahami alasan risk signal.
- Memberikan outcome.
- Menambahkan catatan review.

### 4.2 Administrator / System Operator

Untuk kebutuhan prototype dapat memiliki fungsi terbatas untuk:

- Menjalankan analisis.
- Memeriksa health aplikasi.
- Mengelola dataset prototype.
- Memeriksa audit log.

---

## 5. Functional Requirements

## FR-01 — Dataset Loading

Sistem harus dapat memuat dataset sintetis yang mengikuti struktur:

```text
patients
providers
encounters
diagnoses
procedures
claims
claim_items
billing_items
evidence_links
risk_signals
cases
review_outcomes
audit_logs
```

### Acceptance Criteria

- Dataset dapat dimasukkan ke PostgreSQL.
- Foreign key antarentitas konsisten.
- Claim dapat ditelusuri ke claim item.
- Claim item dapat ditelusuri ke evidence.

---

## FR-02 — Claim and Claim Item View

Sistem harus menampilkan informasi claim dan detail claim item.

Minimum field:

```text
Claim ID
Encounter ID
Claim Date
Total Amount
Claim Item ID
Service Code
Quantity
Net Amount
```

### Acceptance Criteria

Reviewer dapat membuka sebuah claim dan melihat seluruh claim item yang terkait.

---

## FR-03 — Evidence Reconciliation

Sistem harus membandingkan claim item terhadap supporting evidence.

Input minimum:

```text
Claimed Quantity
Supported Quantity
Evidence Availability
Match Status
```

Output:

```text
Evidence Status
Evidence Gap
Coverage Percentage
Primary Signal
Review Priority
Reason
```

Rumus:

```text
Evidence Gap = Claimed Quantity - Supported Quantity

Coverage (%) = Supported Quantity / Claimed Quantity × 100
```

Untuk claimed quantity = 0, coverage ditetapkan 100% pada implementation baseline agar tidak terjadi pembagian dengan nol.

---

## FR-04 — Evidence Status Classification

Decision engine harus menghasilkan empat status:

### SUPPORTED

```text
supported_qty >= claimed_qty
```

### PARTIAL

```text
0 < supported_qty < claimed_qty
```

### UNSUPPORTED

```text
supported_qty = 0
AND evidence_available = true
```

### UNAVAILABLE

```text
evidence_available = false
```

### Guardrail

```text
UNAVAILABLE ≠ UNSUPPORTED
UNSUPPORTED ≠ PROVEN FRAUD
```

---

## FR-05 — Phantom Billing Signal

Sistem dapat menghasilkan signal `PHANTOM_BILLING` ketika:

```text
evidence_available = true
AND
supported_qty = 0
```

Signal harus disimpan beserta:

```text
claim_id
claim_item_id
signal_type
severity
reason
```

Signal merupakan **indikasi untuk review**, bukan keputusan final fraud.

---

## FR-06 — Pattern Review Signal

Sistem dapat menerima pattern signal seperti `PATTERN_REVIEW`.

Pattern signal tidak boleh menimpa kondisi evidence yang menunjukkan claim fully supported menjadi Phantom Billing secara otomatis.

Contoh baseline:

```text
SUPPORTED
+
pattern signal
→ PATTERN_REVIEW
```

---

## FR-07 — Case Assembly

Risk signal harus dapat dibentuk menjadi sebuah case.

Minimum atribut case:

```text
case_id
claim_id
primary_risk_mode
priority
status
evidence_gap
coverage
affected_items
review_focus
```

---

## FR-08 — Investigation Queue

Frontend harus menyediakan antrean case untuk review.

Minimum kolom:

```text
Case ID
Claim ID
Risk Type
Priority
Status
```

Reviewer dapat membuka detail sebuah case dari queue.

---

## FR-09 — Evidence Chain

Detail case harus menampilkan rantai informasi:

```text
Case
 ↓
Claim
 ↓
Claim Item
 ↓
Evidence
 ↓
Risk Signal
 ↓
Review Focus
```

Tujuan utama adalah **traceability**, bukan sekadar menampilkan score.

---

## FR-10 — Reviewer Outcome

Reviewer harus dapat menyimpan outcome minimal:

```text
CONFIRMED
NOT_CONFIRMED
NEEDS_MORE_EVIDENCE
FALSE_POSITIVE
```

Reviewer juga dapat mengisi catatan.

Catatan:

- `CONFIRMED` dalam prototype hanya merupakan label outcome review manusia.
- Label tersebut bukan keputusan hukum nasional atau keputusan BPJS production.

---

## FR-11 — Audit Trail

Tindakan review penting harus dicatat.

Minimum:

```text
timestamp
actor
action
case_id
previous_status
new_status
note
```

---

## FR-12 — Dashboard

Dashboard minimum menampilkan:

- total claims analyzed;
- jumlah case;
- distribusi evidence status;
- high-priority cases;
- no-conclusion cases.

Seluruh angka prototype harus diberi konteks bahwa dataset adalah synthetic.

---

## FR-13 — Analysis Run

Sistem menyediakan endpoint untuk menjalankan atau mengulang decision analysis terhadap dataset yang tersedia.

Endpoint baseline:

```http
POST /api/analysis/run
```

---

## FR-14 — Health Check

Backend harus menyediakan health check:

```http
GET /api/health
```

Endpoint minimal menginformasikan service hidup dan siap menerima request.

---

# 6. Non-Functional Requirements

## NFR-01 — Explainability

Setiap risk signal harus memiliki reason yang dapat dipahami reviewer.

Contoh:

```text
Evidence is available, but no supporting service evidence was matched to the claimed item.
```

## NFR-02 — Safety

Sistem tidak boleh mengubah evidence unavailable menjadi fraud conclusion.

## NFR-03 — Traceability

Reviewer harus dapat menelusuri signal kembali ke claim item dan evidence.

## NFR-04 — Data Privacy

Development menggunakan synthetic/simulated data. Jangan masukkan data JKN nyata ke repository prototype tanpa dasar izin dan governance yang sesuai.

## NFR-05 — Reproducibility

Dataset, seed database, decision rules, dan environment harus dapat dijalankan ulang oleh developer lain.

## NFR-06 — Maintainability

Decision engine harus dipisahkan dari route handler agar aturan mudah diuji dan dikembangkan.

## NFR-07 — API Simplicity

Gunakan REST/JSON untuk komunikasi frontend-backend dalam MVP.

## NFR-08 — Deployment Portability

Aplikasi harus dapat dijalankan secara konsisten menggunakan Docker Compose pada environment yang memenuhi dependency.

---

# 7. Tech Stack

## 7.1 Bahasa Pemrograman

### JavaScript

Digunakan untuk:

- frontend React;
- backend Node.js;
- decision engine.

### SQL

Digunakan untuk:

- schema PostgreSQL;
- seed data;
- query relational data.

Tidak perlu Python untuk core MVP.

---

## 7.2 Frontend

| Komponen | Teknologi | Fungsi |
|---|---|---|
| UI | React | Antarmuka aplikasi |
| Build tool | Vite | Development dan production build |
| Icons | Lucide React | Icon interface |
| HTTP | Fetch / REST | Komunikasi dengan backend |
| Web server | Nginx | Serve frontend dan reverse proxy sesuai deployment |

---

## 7.3 Backend

| Komponen | Teknologi | Fungsi |
|---|---|---|
| Runtime | Node.js 20+ | Runtime server |
| Framework | Express 5.x | REST API |
| Database client | pg 8.x | Akses PostgreSQL |
| CORS | cors | Cross-origin handling pada development |
| Decision Engine | JavaScript | Rule-based deterministic analysis |

---

## 7.4 Database

**PostgreSQL** menjadi relational database utama.

Database harus menyimpan data yang mengikuti entity model dataset V4.

---

## 7.5 Infrastructure / Deployment

| Komponen | Teknologi |
|---|---|
| Containerization | Docker |
| Orchestration lokal | Docker Compose |
| Frontend serving | Nginx |
| Database | PostgreSQL container |

---

# 8. Environment Requirement

## 8.1 Minimum Development Environment

### Operating System

Direkomendasikan:

- Windows 11 + WSL2 + Ubuntu 24.04; atau
- Ubuntu Linux 22.04/24.04; atau
- macOS modern yang mendukung Docker Desktop.

Untuk Windows, WSL2 merupakan pilihan yang disarankan agar environment Linux lebih konsisten dengan deployment container.

### Required Software

| Software | Recommended Baseline |
|---|---|
| Git | latest stable |
| Docker Desktop | latest stable yang mendukung Compose V2 |
| Docker Engine | current stable jika native Linux |
| Docker Compose | Compose V2 |
| Node.js | >= 20 LTS |
| npm | versi yang sesuai dengan Node.js |
| PostgreSQL | dijalankan melalui Docker pada baseline MVP |
| VS Code | recommended editor |
| Browser | Chrome / Edge / Firefox modern |

### Resource Recommendation

Untuk development containerized:

```text
CPU : 4 cores atau lebih
RAM : 8 GB minimum
Disk: 10 GB+ ruang kosong untuk project, image dan database
```

Untuk demo yang lebih nyaman:

```text
CPU : 4–8 cores
RAM : 12–16 GB
SSD : 20 GB+ ruang kosong
```

Angka resource tersebut adalah rekomendasi engineering untuk prototype, bukan requirement resmi Healthkathon.

---

# 9. Struktur Repository

Struktur repository yang disarankan:

```text
jkn-integrity-intelligence/
│
├── README.md
├── PRD.md
├── docker-compose.yml
├── .env.example
├── .gitignore
│
├── docs/
│   ├── architecture.md
│   ├── data-dictionary.md
│   ├── decision-rules.md
│   ├── api-spec.md
│   ├── demo-walkthrough.md
│   └── validation-report.md
│
├── data/
│   └── synthetic/
│       ├── patients.csv
│       ├── providers.csv
│       ├── encounters.csv
│       ├── diagnoses.csv
│       ├── procedures.csv
│       ├── claims.csv
│       ├── claim_items.csv
│       ├── billing_items.csv
│       ├── evidence_links.csv
│       ├── risk_signals.csv
│       ├── cases.csv
│       ├── review_outcomes.csv
│       ├── audit_logs.csv
│       └── synthetic_claim_analysis.csv
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
│
├── backend/
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│       ├── server.js
│       ├── app.js
│       │
│       ├── config/
│       │   └── env.js
│       │
│       ├── db/
│       │   ├── pool.js
│       │   └── queries/
│       │       ├── dashboardQueries.js
│       │       ├── caseQueries.js
│       │       └── evidenceQueries.js
│       │
│       ├── decision/
│       │   ├── decisionEngine.js
│       │   ├── rules.js
│       │   └── validators.js
│       │
│       ├── services/
│       │   ├── analysisService.js
│       │   ├── caseService.js
│       │   ├── dashboardService.js
│       │   ├── evidenceService.js
│       │   └── reviewService.js
│       │
│       ├── controllers/
│       │   ├── analysisController.js
│       │   ├── caseController.js
│       │   ├── dashboardController.js
│       │   ├── evidenceController.js
│       │   └── reviewController.js
│       │
│       ├── routes/
│       │   ├── healthRoutes.js
│       │   ├── dashboardRoutes.js
│       │   ├── caseRoutes.js
│       │   ├── evidenceRoutes.js
│       │   └── analysisRoutes.js
│       │
│       └── middleware/
│           ├── errorHandler.js
│           └── requestLogger.js
│
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/
│       │   ├── client.js
│       │   ├── dashboardApi.js
│       │   ├── caseApi.js
│       │   ├── evidenceApi.js
│       │   └── reviewApi.js
│       │
│       ├── components/
│       │   ├── layout/
│       │   ├── dashboard/
│       │   ├── cases/
│       │   ├── evidence/
│       │   └── common/
│       │
│       ├── pages/
│       │   ├── DashboardPage.jsx
│       │   ├── CasesPage.jsx
│       │   ├── CaseDetailPage.jsx
│       │   └── NotFoundPage.jsx
│       │
│       ├── hooks/
│       ├── utils/
│       └── styles/
│
├── nginx/
│   └── nginx.conf
│
├── tests/
│   ├── unit/
│   │   └── decisionEngine.test.js
│   ├── integration/
│   └── fixtures/
│
└── scripts/
    ├── importDataset.js
    ├── validateDataset.js
    └── resetDatabase.sh
```

---

# 10. Module Responsibilities

## 10.1 frontend/src/pages

Berisi halaman utama aplikasi.

### DashboardPage

Menampilkan ringkasan analytic state.

### CasesPage

Menampilkan investigation queue.

### CaseDetailPage

Menampilkan case, claim, claim item, evidence chain, dan review outcome.

---

## 10.2 frontend/src/components

Komponen UI reusable.

Contoh:

```text
RiskKpiCard
PriorityBadge
EvidenceStatusBadge
CaseTable
ClaimItemTable
EvidenceChain
ReviewOutcomeForm
AuditTimeline
```

---

## 10.3 backend/src/decision

Ini adalah pusat business rule.

### decisionEngine.js

Menjalankan fungsi evaluasi utama.

Baseline function:

```text
evaluateClaim({
  claimedQty,
  supportedQty,
  evidenceAvailable,
  utilizationSignal,
  recordSimilaritySignal
})
```

Output:

```text
availability
status
gap
coveragePct
primarySignal
reviewPriority
reason
```

---

## 10.4 backend/src/services

Menangani business workflow di luar rule engine.

Contoh:

```text
analysisService
caseService
evidenceService
reviewService
dashboardService
```

Separation ini menjaga controller tidak berisi business logic terlalu banyak.

---

## 10.5 backend/src/controllers

Menerima request HTTP dan meneruskan ke service.

```text
Request
  ↓
Controller
  ↓
Service
  ↓
Query / Decision Engine
  ↓
Response
```

---

## 10.6 backend/src/routes

Mendefinisikan endpoint API.

---

# 11. API Requirements

## GET /api/health

### Purpose
Health check.

### Response example

```json
{
  "status": "ok"
}
```

---

## GET /api/dashboard

### Purpose
Mengambil ringkasan dashboard.

### Response concept

```json
{
  "claimsAnalyzed": 40,
  "caseCount": 28,
  "supported": 20,
  "partial": 8,
  "unsupported": 8,
  "unavailable": 4
}
```

Nilai tersebut merupakan struktur contoh dari synthetic dataset baseline, bukan statistik JKN nasional.

---

## GET /api/cases

### Purpose
Mengambil investigation queue.

Filter yang disarankan:

```text
status
priority
riskType
search
```

---

## GET /api/cases/:caseId

### Purpose
Mengambil detail case.

Harus mengembalikan minimal:

```text
case
claim
claim_items
risk_signals
review_status
```

---

## GET /api/cases/:caseId/evidence

### Purpose
Mengambil evidence chain yang berkaitan dengan case.

---

## POST /api/analysis/run

### Purpose
Menjalankan decision engine terhadap data yang tersedia.

### Expected Behavior

1. membaca claim dan claim item;
2. membaca evidence link;
3. menghitung status evidence;
4. membuat atau memperbarui risk signal;
5. membuat atau memperbarui case.

---

## POST /api/cases/:caseId/outcome

### Purpose
Menyimpan outcome reviewer.

### Example

```json
{
  "outcome": "NEEDS_MORE_EVIDENCE",
  "notes": "Supporting documentation required for final review."
}
```

---

# 12. Database / Entity Model

## Entity List

```text
patients
providers
encounters
diagnoses
procedures
claims
claim_items
billing_items
evidence_links
risk_signals
cases
review_outcomes
audit_logs
```

## Main Relationship

```text
patients
   │
   ▼
encounters
   │
   ├── diagnoses
   └── procedures
          │
          ▼
        claims
          │
          ▼
     claim_items
          │
          ▼
    evidence_links
          │
          ▼
    risk_signals
          │
          ▼
        cases
          │
          ▼
   review_outcomes
          │
          ▼
      audit_logs
```

---

# 13. Dataset Baseline

Dataset yang digunakan pada prototype harus mengacu pada paket synthetic dataset V4 yang disediakan terpisah.

Baseline:

```text
40 claims
80 claim items
80 billing items
80 evidence links
44 risk signals
28 cases
```

Distribusi dashboard baseline:

```text
SUPPORTED   = 20
PARTIAL     = 8
UNSUPPORTED = 8
UNAVAILABLE = 4
```

Angka tersebut **hanya menggambarkan data sintetis yang dibuat untuk pengujian**, bukan prevalensi fraud JKN.

---

# 14. Mandatory Demo Cases

## CASE-0025 — Phantom Billing

```text
Claim: CLM-0025
Claimed Quantity: 10
Evidence Available: YES
Supported Quantity: 0
Gap: 10
Coverage: 0%
Status: UNSUPPORTED
Signal: PHANTOM_BILLING
Priority: HIGH
```

Expected flow:

```text
CASE-0025
 ↓
CLM-0025
 ↓
Claim Item
 ↓
Evidence Available
 ↓
No Supporting Match
 ↓
UNSUPPORTED
 ↓
PHANTOM_BILLING
 ↓
HIGH PRIORITY
 ↓
Human Review
```

---

## CASE-0033 — No Conclusion

```text
Claim: CLM-0033
Claimed Quantity: 10
Evidence Available: NO
Status: UNAVAILABLE
Priority: NO_CONCLUSION
```

Expected behavior:

```text
Evidence unavailable
 ↓
UNAVAILABLE
 ↓
NO_CONCLUSION
```

Tidak boleh menjadi Phantom Billing hanya karena evidence tidak tersedia.

---

## CASE-0037 — Pattern Review

```text
Claim: CLM-0037
Evidence: SUPPORTED
Pattern Signal: PRESENT
Signal: PATTERN_REVIEW
```

Expected behavior:

```text
SUPPORTED
+
Pattern Signal
 ↓
PATTERN_REVIEW
```

Tidak boleh dikonversi menjadi Phantom Billing secara otomatis.

---

# 15. Decision Engine Rules

Pseudo-code baseline:

```text
INPUT:
  claimedQty
  supportedQty
  evidenceAvailable
  utilizationSignal
  recordSimilaritySignal

IF claimedQty < 0:
    ERROR

IF evidenceAvailable = FALSE:
    status = UNAVAILABLE
    primarySignal = null
    reviewPriority = NO_CONCLUSION
    STOP

supportedQty = clamp(supportedQty, 0, claimedQty)
gap = claimedQty - supportedQty

IF claimedQty = 0:
    coverage = 100
ELSE:
    coverage = supportedQty / claimedQty * 100

IF supportedQty >= claimedQty:
    status = SUPPORTED

    IF utilizationSignal OR recordSimilaritySignal:
        primarySignal = PATTERN_REVIEW
        reviewPriority = MEDIUM
    ELSE:
        primarySignal = null
        reviewPriority = LOW

ELSE IF supportedQty > 0:
    status = PARTIAL
    primarySignal = REVIEW
    reviewPriority = MEDIUM

ELSE:
    status = UNSUPPORTED
    primarySignal = PHANTOM_BILLING
    reviewPriority = HIGH
```

---

# 16. UI Requirements

## Dashboard

Minimum sections:

```text
Header
 ↓
KPI Cards
 ↓
Evidence Status Distribution
 ↓
Priority Summary
 ↓
Recent / Priority Cases
```

## Cases Page

Minimum:

```text
Search
Filter
Case Table
Priority Badge
Status
Open Detail
```

## Case Detail Page

Minimum:

```text
Case Summary
 ↓
Claim Summary
 ↓
Affected Claim Items
 ↓
Evidence Chain
 ↓
Risk Reason
 ↓
Review Focus
 ↓
Outcome Form
 ↓
Audit Timeline
```

---

# 17. UX Principles

1. **Evidence before label.** Tampilkan supporting evidence sebelum risk label menjadi fokus utama.
2. **Traceability over opaque scoring.** Reviewer harus dapat mengikuti hubungan data.
3. **No automatic accusation.** Gunakan istilah `signal`, `case`, `priority`, dan `review`.
4. **Clear uncertainty.** `UNAVAILABLE` harus terlihat berbeda dari `UNSUPPORTED`.
5. **Action-oriented.** Setiap case harus memiliki review focus.

---

# 18. Security and Governance

## 18.1 Data

Gunakan synthetic data untuk prototype.

## 18.2 Authentication

Authentication production belum menjadi requirement inti MVP. Namun struktur backend harus mudah ditambah middleware authentication/authorization.

## 18.3 Authorization

Future implementation dapat menggunakan role:

```text
ADMIN
REVIEWER
VIEWER
```

## 18.4 Auditability

Perubahan outcome harus memiliki histori.

## 18.5 Secrets

Connection string, password, API key, dan secret tidak boleh di-commit ke repository.

Gunakan:

```text
.env
.env.example
```

---

# 19. Environment Variables

Baseline `.env.example`:

```dotenv
NODE_ENV=development
PORT=3000

DB_HOST=postgres
DB_PORT=5432
DB_NAME=jkn_integrity
DB_USER=jkn_app
DB_PASSWORD=change_me

CORS_ORIGIN=http://localhost:5173
```

Frontend:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
```

Production/demo secret harus diganti dan tidak menggunakan default password.

---

# 20. Docker Compose Architecture

Baseline service:

```text
frontend
backend
postgres
```

Optional:

```text
nginx
```

Recommended logical flow:

```text
Browser
  │
  ▼
Frontend / Nginx
  │
  ▼
Backend
  │
  ├── Decision Engine
  │
  └── PostgreSQL
```

---

# 21. Development Flow

```text
1. Clone repository
       ↓
2. Install dependencies
       ↓
3. Copy .env.example → .env
       ↓
4. Start PostgreSQL / Docker Compose
       ↓
5. Run schema + seed
       ↓
6. Run backend
       ↓
7. Run frontend
       ↓
8. Validate health API
       ↓
9. Run decision engine tests
       ↓
10. Open dashboard
       ↓
11. Test mandatory cases
```

---

# 22. Testing Strategy

## Unit Tests

Decision engine wajib diuji minimal untuk:

```text
supported
partial
phantom / unsupported
unavailable
pattern-only
```

## Integration Tests

Uji:

```text
API → service → database
```

## UI / E2E Tests

Minimal flow:

```text
Dashboard
 → Cases
 → CASE-0025
 → Evidence
 → Outcome
```

---

# 23. Acceptance Test Matrix

| ID | Scenario | Expected Result |
|---|---|---|
| AT-01 | Evidence fully supports claim | SUPPORTED |
| AT-02 | Evidence supports part of claim | PARTIAL |
| AT-03 | Evidence available but supports zero | UNSUPPORTED + PHANTOM_BILLING |
| AT-04 | Evidence unavailable | UNAVAILABLE + NO_CONCLUSION |
| AT-05 | Supported claim + pattern signal | PATTERN_REVIEW |
| AT-06 | Open case | Claim, item, evidence visible |
| AT-07 | Reviewer submits outcome | Outcome stored |
| AT-08 | Reviewer changes case status | Audit log created |
| AT-09 | Dashboard loads | KPI and distribution shown |
| AT-10 | Health endpoint called | status=ok |

---

# 24. Definition of Done — MVP

MVP dianggap selesai apabila seluruh kondisi berikut terpenuhi:

- [ ] Frontend dapat berjalan.
- [ ] Backend dapat berjalan.
- [ ] PostgreSQL dapat berjalan.
- [ ] Dataset V4 dapat di-load.
- [ ] `/api/health` berhasil.
- [ ] `/api/dashboard` berhasil.
- [ ] `/api/cases` berhasil.
- [ ] `/api/cases/:caseId` berhasil.
- [ ] `/api/cases/:caseId/evidence` berhasil.
- [ ] `/api/analysis/run` berhasil.
- [ ] `/api/cases/:caseId/outcome` berhasil.
- [ ] Decision engine lulus unit test.
- [ ] CASE-0025 menghasilkan PHANTOM_BILLING.
- [ ] CASE-0033 menghasilkan NO_CONCLUSION.
- [ ] CASE-0037 tetap PATTERN_REVIEW.
- [ ] Evidence chain terlihat di UI.
- [ ] Reviewer dapat menyimpan outcome.
- [ ] Audit log tersimpan.
- [ ] Tidak ada credential production di repository.
- [ ] Semua data demo diberi label synthetic.

---

# 25. Roadmap Setelah MVP

## Phase 1 — MVP Stabilization

- Hardening API.
- Improved validation.
- Better error handling.
- Automated integration tests.
- Better audit UI.

## Phase 2 — Production-Ready Governance

- Authentication.
- RBAC.
- Structured access logging.
- Encryption strategy.
- Data retention.
- Data quality monitoring.

## Phase 3 — Advanced Analytics

Dapat dipertimbangkan setelah baseline deterministic engine tervalidasi:

- anomaly detection;
- utilization analytics;
- similarity detection;
- statistical risk features;
- ML assistance.

ML tidak boleh menggantikan evidence chain dan human review.

## Phase 4 — Interoperability

Dapat dipertimbangkan untuk future integration dengan sistem eksternal yang memiliki legal, security, interoperability, dan governance basis yang sesuai.

Prototype saat ini tidak mengklaim integrasi production.

---

# 26. Technical Guardrails

### Guardrail 1

```text
UNAVAILABLE ≠ FRAUD
```

### Guardrail 2

```text
Risk Signal ≠ Final Decision
```

### Guardrail 3

```text
Synthetic Dataset ≠ JKN Population Data
```

### Guardrail 4

```text
Prototype Schema ≠ BPJS Internal Database Schema
```

### Guardrail 5

```text
Priority ≠ Fraud Probability
```

### Guardrail 6

```text
Pattern Anomaly ≠ Phantom Billing Proof
```

### Guardrail 7

```text
No direct production integration claim unless technically and legally verified.
```

---

# 27. Final System Architecture

```text
                         USER / REVIEWER
                                │
                                ▼
                     ┌────────────────────┐
                     │       Browser      │
                     └─────────┬──────────┘
                               │
                               ▼
                     ┌────────────────────┐
                     │ React + Vite       │
                     │ UI                  │
                     └─────────┬──────────┘
                               │
                          REST / JSON
                               │
                               ▼
                     ┌────────────────────┐
                     │ Node.js + Express  │
                     │ Backend API        │
                     └─────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌──────────────┐ ┌───────────────┐ ┌──────────────┐
       │ Case /       │ │ Decision      │ │ Evidence /   │
       │ Review       │ │ Engine        │ │ Analysis     │
       │ Services     │ │               │ │ Services     │
       └──────┬───────┘ └───────┬───────┘ └──────┬───────┘
              │                 │                │
              └─────────────────┼────────────────┘
                                ▼
                     ┌────────────────────┐
                     │    PostgreSQL      │
                     │                    │
                     │ Claim              │
                     │ Claim Item         │
                     │ Evidence           │
                     │ Risk Signal        │
                     │ Case               │
                     │ Review Outcome     │
                     │ Audit Log          │
                     └────────────────────┘
```

---

# 28. One-Sentence Product Definition

> **JKN Integrity Intelligence adalah sistem pendukung keputusan berbasis evidence yang menghubungkan claim, claim item, supporting evidence, risk signal, dan case sehingga reviewer dapat menelusuri kesenjangan bukti dan menentukan tindak lanjut secara lebih terstruktur.**

---

# 29. Implementation Principle

Urutan implementasi harus mengikuti prinsip:

```text
DATA FIRST
   ↓
EVIDENCE TRACEABILITY
   ↓
DETERMINISTIC RULES
   ↓
CASE ASSEMBLY
   ↓
REVIEW UI
   ↓
AUDITABILITY
   ↓
ADVANCED ANALYTICS (FUTURE)
```

Jangan membangun ML terlebih dahulu sebelum data relationship, evidence model, deterministic rules, dan audit workflow stabil.

---

## 30. Reference Files Used by This PRD

PRD ini disusun agar konsisten dengan artefak prototype berikut:

- `JKN_Integrity_Intelligence_Dataset_V4.zip`
- `JKN_Integrity_Intelligence_Arsitektur_Sistem.md`
- `JKN_Integrity_Intelligence_Proposal_2026_Final.docx`

Dataset V4 digunakan sebagai baseline synthetic data untuk development dan demo.

---
