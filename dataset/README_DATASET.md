# JKN Integrity Intelligence – Synthetic Dataset V4

Seluruh data dalam paket ini adalah **SYNTHETIC / SIMULATED** untuk prototype dan demo. Data ini bukan data produksi BPJS Kesehatan/SATUSEHAT dan tidak merepresentasikan prevalensi fraud JKN.

## Isi paket

| File | Isi |
|---|---|
| patients.csv | 20 pasien sintetis |
| providers.csv | 5 faskes sintetis |
| encounters.csv | 40 encounter |
| diagnoses.csv | 40 diagnosis |
| procedures.csv | prosedur dan quantity dukungan |
| claims.csv | 40 header klaim |
| claim_items.csv | 80 item klaim |
| billing_items.csv | 80 item billing |
| evidence_links.csv | 80 relasi item–evidence |
| risk_signals.csv | indikasi risiko sintetis |
| cases.csv | case investigasi sintetis |
| review_outcomes.csv | tabel outcome review (kosong sampai reviewer submit) |
| audit_logs.csv | tabel audit log (kosong sampai ada tindakan) |
| synthetic_claim_analysis.csv | ringkasan 40 klaim + expected engine output/ground truth |
| schema.sql | DDL PostgreSQL |
| seed.sql | seed database lengkap |
| DATA_DICTIONARY.md | daftar kolom per tabel |

## Case demo utama

- **CASE-0025 / CLM-0025**: synthetic Phantom Billing scenario; evidence tersedia, tidak match, supported quantity 0, gap 10, coverage 0%, signal Phantom Billing, priority HIGH.
- **CASE-0033 / CLM-0033**: evidence unavailable; status UNAVAILABLE dan NO_CONCLUSION.
- **CASE-0037 / CLM-0037**: pattern-only scenario; evidence didukung dan signal pattern review, bukan Phantom Billing.

## Prinsip interpretasi

`UNAVAILABLE ≠ UNSUPPORTED`

`Risk Signal ≠ Final Fraud Decision`

Reviewer manusia tetap menentukan outcome.
