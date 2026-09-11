# JKN Integrity Intelligence (MVP: Phantom Billing)

> **Detect the Gap. Trace the Evidence. Guide the Review.**

Decision-support system berbasis evidence reconciliation untuk membantu proses identifikasi awal dan pemeriksaan indikasi fraud pada klaim JKN, dengan fokus MVP pada **Phantom Billing**.

📖 **Dokumentasi Lengkap:**
- [Spesifikasi Arsitektur Sistem & Alur Proses Bisnis](ARSITEKTUR_DAN_PROSES_BISNIS.md)
- [Dokumen PRD Lengkap](docs/PRD.md)
- [Kamus Data Database](docs/DATA_DICTIONARY.md)

---

## 1. Arsitektur & Alur Keputusan

```text
Claim
   ↓
Claim Item
   ↓
Evidence
   ↓
Evidence Reconciliation
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
Review Outcome
   ↓
Audit Trail
```

### Prinsip Utama Guardrail
- `UNAVAILABLE ≠ UNSUPPORTED`
- `UNSUPPORTED ≠ PROVEN FRAUD`
- `RISK SIGNAL ≠ FINAL DECISION`

---

## 2. Cara Menjalankan

### Opsi A: Menggunakan Docker Compose (Recommended)
```bash
# 1. Pastikan docker engine aktif
docker compose up -d

# 2. Akses aplikasi:
# Frontend: http://localhost
# Backend API: http://localhost:3000/api/health
```

### Opsi B: Menjalankan Secara Native (Development)
```bash
# 1. Database
psql -U akhzafachrozy -d postgres -c "CREATE DATABASE jkn_integrity;"
psql -U akhzafachrozy -d jkn_integrity -f database/schema.sql
psql -U akhzafachrozy -d jkn_integrity -f database/seed.sql

# 2. Backend
cd backend
npm install
npm run dev

# 3. Frontend
cd frontend
npm install
npm run dev
```
