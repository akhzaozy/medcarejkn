CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    case_id VARCHAR(40) REFERENCES cases(case_id) ON DELETE CASCADE,
    recipient_username VARCHAR(50),
    recipient_role VARCHAR(50),
    sender_username VARCHAR(50),
    sender_name TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_username, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(recipient_role, read, created_at DESC);

-- Seed contextual notifications if target cases are already present
INSERT INTO notifications (id, case_id, recipient_username, recipient_role, sender_username, sender_name, title, message, type, read, created_at)
SELECT 'notif-seed-001', 'CASE-PB-001', 'dr.anindya', 'clinical_reviewer', 'staff.ahmad', 'Ahmad Fauzi, S.E.', 'Disposisi Berkas Kasus Prioritas', 'Staff Ahmad menugaskan kasus CASE-PB-001 (RS Hermina) untuk telaah rekam medis.', 'assignment', FALSE, NOW() - INTERVAL '30 minutes'
WHERE EXISTS (SELECT 1 FROM cases WHERE case_id = 'CASE-PB-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, case_id, recipient_username, recipient_role, sender_username, sender_name, title, message, type, read, created_at)
SELECT 'notif-seed-002', 'CASE-PB-003', 'dr.budi', 'clinical_reviewer', 'staff.ahmad', 'Ahmad Fauzi, S.E.', 'Disposisi Berkas Kasus Prioritas', 'Staff Ahmad menugaskan kasus CASE-PB-003 (RSUD Dr. Soetomo) untuk telaah rekam medis.', 'assignment', FALSE, NOW() - INTERVAL '1 hour'
WHERE EXISTS (SELECT 1 FROM cases WHERE case_id = 'CASE-PB-003')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, case_id, recipient_username, recipient_role, sender_username, sender_name, title, message, type, read, created_at)
SELECT 'notif-seed-003', 'CASE-PB-003', 'staff.ahmad', 'staff_jkn', 'komite.medik', 'Komite Medik RSUD Dr. Soetomo', 'Sanggahan Faskes Masuk', 'Fasilitas kesehatan telah mengajukan berkas sanggahan klarifikasi tindakan pada CASE-PB-003.', 'dispute', FALSE, NOW() - INTERVAL '15 minutes'
WHERE EXISTS (SELECT 1 FROM cases WHERE case_id = 'CASE-PB-003')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, case_id, recipient_username, recipient_role, sender_username, sender_name, title, message, type, read, created_at)
SELECT 'notif-seed-004', 'CASE-PB-004', 'staff.ahmad', 'staff_jkn', 'dr.ratna', 'dr. Ratna Dewi, Sp.PD', 'Hasil Telaah Klinis Dokter Selesai', 'dr. Ratna Dewi telah menetapkan keputusan telaah klinis pada CASE-PB-004.', 'outcome', TRUE, NOW() - INTERVAL '2 hours'
WHERE EXISTS (SELECT 1 FROM cases WHERE case_id = 'CASE-PB-004')
ON CONFLICT (id) DO NOTHING;
