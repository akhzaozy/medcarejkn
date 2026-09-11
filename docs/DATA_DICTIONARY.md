# Data Dictionary – JKN Integrity Intelligence V4 Synthetic Dataset

## patients

| Column | Description |
|---|---|
| `patient_id` | Kolom `patient_id` dari schema prototype. |
| `age_group` | Kolom `age_group` dari schema prototype. |
| `sex` | Kolom `sex` dari schema prototype. |
| `data_status` | Kolom `data_status` dari schema prototype. |

## providers

| Column | Description |
|---|---|
| `provider_id` | Kolom `provider_id` dari schema prototype. |
| `provider_name` | Kolom `provider_name` dari schema prototype. |
| `provider_type` | Kolom `provider_type` dari schema prototype. |
| `data_status` | Kolom `data_status` dari schema prototype. |

## encounters

| Column | Description |
|---|---|
| `encounter_id` | Kolom `encounter_id` dari schema prototype. |
| `patient_id` | Kolom `patient_id` dari schema prototype. |
| `provider_id` | Kolom `provider_id` dari schema prototype. |
| `service_date` | Kolom `service_date` dari schema prototype. |
| `encounter_type` | Kolom `encounter_type` dari schema prototype. |
| `data_status` | Kolom `data_status` dari schema prototype. |

## diagnoses

| Column | Description |
|---|---|
| `diagnosis_id` | Kolom `diagnosis_id` dari schema prototype. |
| `encounter_id` | Kolom `encounter_id` dari schema prototype. |
| `diagnosis_code` | Kolom `diagnosis_code` dari schema prototype. |
| `diagnosis_role` | Kolom `diagnosis_role` dari schema prototype. |
| `data_status` | Kolom `data_status` dari schema prototype. |

## procedures

| Column | Description |
|---|---|
| `procedure_id` | Kolom `procedure_id` dari schema prototype. |
| `encounter_id` | Kolom `encounter_id` dari schema prototype. |
| `procedure_code` | Kolom `procedure_code` dari schema prototype. |
| `procedure_date` | Kolom `procedure_date` dari schema prototype. |
| `quantity_supported` | Kolom `quantity_supported` dari schema prototype. |
| `record_status` | Kolom `record_status` dari schema prototype. |
| `claim_item_id` | Kolom `claim_item_id` dari schema prototype. |
| `data_status` | Kolom `data_status` dari schema prototype. |

## claims

| Column | Description |
|---|---|
| `claim_id` | Kolom `claim_id` dari schema prototype. |
| `encounter_id` | Kolom `encounter_id` dari schema prototype. |
| `provider_id` | Kolom `provider_id` dari schema prototype. |
| `claim_date` | Kolom `claim_date` dari schema prototype. |
| `claim_status` | Kolom `claim_status` dari schema prototype. |
| `total_amount` | Kolom `total_amount` dari schema prototype. |
| `data_status` | Kolom `data_status` dari schema prototype. |

## claim_items

| Column | Description |
|---|---|
| `claim_item_id` | Kolom `claim_item_id` dari schema prototype. |
| `claim_id` | Kolom `claim_id` dari schema prototype. |
| `sequence_no` | Kolom `sequence_no` dari schema prototype. |
| `service_code` | Kolom `service_code` dari schema prototype. |
| `service_type` | Kolom `service_type` dari schema prototype. |
| `quantity` | Kolom `quantity` dari schema prototype. |
| `unit_price` | Kolom `unit_price` dari schema prototype. |
| `net_amount` | Kolom `net_amount` dari schema prototype. |
| `encounter_id` | Kolom `encounter_id` dari schema prototype. |
| `ground_truth_item_status` | Kolom `ground_truth_item_status` dari schema prototype. |

## billing_items

| Column | Description |
|---|---|
| `billing_id` | Kolom `billing_id` dari schema prototype. |
| `claim_id` | Kolom `claim_id` dari schema prototype. |
| `claim_item_id` | Kolom `claim_item_id` dari schema prototype. |
| `item_code` | Kolom `item_code` dari schema prototype. |
| `quantity` | Kolom `quantity` dari schema prototype. |
| `amount` | Kolom `amount` dari schema prototype. |
| `data_status` | Kolom `data_status` dari schema prototype. |

## evidence_links

| Column | Description |
|---|---|
| `evidence_link_id` | Kolom `evidence_link_id` dari schema prototype. |
| `claim_item_id` | Kolom `claim_item_id` dari schema prototype. |
| `evidence_type` | Kolom `evidence_type` dari schema prototype. |
| `source_id` | Kolom `source_id` dari schema prototype. |
| `match_status` | Kolom `match_status` dari schema prototype. |
| `match_quantity` | Kolom `match_quantity` dari schema prototype. |
| `availability` | Kolom `availability` dari schema prototype. |
| `reason` | Kolom `reason` dari schema prototype. |
| `data_status` | Kolom `data_status` dari schema prototype. |

## risk_signals

| Column | Description |
|---|---|
| `signal_id` | Kolom `signal_id` dari schema prototype. |
| `claim_id` | Kolom `claim_id` dari schema prototype. |
| `claim_item_id` | Kolom `claim_item_id` dari schema prototype. |
| `signal_type` | Kolom `signal_type` dari schema prototype. |
| `severity` | Kolom `severity` dari schema prototype. |
| `reason_code` | Kolom `reason_code` dari schema prototype. |
| `reason_detail` | Kolom `reason_detail` dari schema prototype. |
| `created_at` | Kolom `created_at` dari schema prototype. |
| `data_status` | Kolom `data_status` dari schema prototype. |

## cases

| Column | Description |
|---|---|
| `case_id` | Kolom `case_id` dari schema prototype. |
| `claim_id` | Kolom `claim_id` dari schema prototype. |
| `primary_risk_mode` | Kolom `primary_risk_mode` dari schema prototype. |
| `review_priority` | Kolom `review_priority` dari schema prototype. |
| `case_status` | Kolom `case_status` dari schema prototype. |
| `affected_items` | Kolom `affected_items` dari schema prototype. |
| `evidence_gap` | Kolom `evidence_gap` dari schema prototype. |
| `evidence_coverage_pct` | Kolom `evidence_coverage_pct` dari schema prototype. |
| `review_focus` | Kolom `review_focus` dari schema prototype. |
| `created_at` | Kolom `created_at` dari schema prototype. |
| `data_status` | Kolom `data_status` dari schema prototype. |

## review_outcomes

| Column | Description |
|---|---|
| `review_id` | Kolom `review_id` dari schema prototype. |
| `case_id` | Kolom `case_id` dari schema prototype. |
| `reviewer_id` | Kolom `reviewer_id` dari schema prototype. |
| `outcome` | Kolom `outcome` dari schema prototype. |
| `notes` | Kolom `notes` dari schema prototype. |
| `reviewed_at` | Kolom `reviewed_at` dari schema prototype. |
| `data_status` | Kolom `data_status` dari schema prototype. |

## audit_logs

| Column | Description |
|---|---|
| `audit_id` | Kolom `audit_id` dari schema prototype. |
| `case_id` | Kolom `case_id` dari schema prototype. |
| `actor_id` | Kolom `actor_id` dari schema prototype. |
| `action` | Kolom `action` dari schema prototype. |
| `detail` | Kolom `detail` dari schema prototype. |
| `created_at` | Kolom `created_at` dari schema prototype. |
