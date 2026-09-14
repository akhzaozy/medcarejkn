import pool from '../config/db.js';

export async function getAllCases({ status, priority, riskMode, search, assignedTo, page = 1, limit = 12 } = {}) {
  const client = await pool.connect();
  try {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const isUnfilteredLimit = limit === 'ALL' || parseInt(limit, 10) <= 0;
    const limitNum = isUnfilteredLimit ? null : (parseInt(limit, 10) || 12);
    const offset = isUnfilteredLimit ? 0 : (pageNum - 1) * limitNum;

    let baseWhere = ' WHERE 1=1';
    const params = [];

    if (status && status !== 'ALL') {
      params.push(status);
      baseWhere += ` AND c.case_status = $${params.length}`;
    }

    if (priority && priority !== 'ALL') {
      params.push(priority);
      baseWhere += ` AND c.review_priority = $${params.length}`;
    }

    if (riskMode && riskMode !== 'ALL') {
      params.push(riskMode);
      baseWhere += ` AND c.primary_risk_mode = $${params.length}`;
    }

    if (assignedTo && assignedTo !== 'ALL') {
      params.push(assignedTo);
      baseWhere += ` AND c.assigned_to = $${params.length}`;
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      baseWhere += ` AND (c.case_id ILIKE $${params.length} OR c.claim_id ILIKE $${params.length} OR pr.provider_name ILIKE $${params.length})`;
    }

    // 1. Fast count query
    const countSql = `
      SELECT COUNT(*) as total
      FROM cases c
      JOIN claims cl ON c.claim_id = cl.claim_id
      JOIN providers pr ON cl.provider_id = pr.provider_id
      ${baseWhere}
    `;
    const countRes = await client.query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);

    // 2. Paginated data query
    let query = `
      SELECT 
        c.case_id,
        c.claim_id,
        c.primary_risk_mode,
        c.review_priority,
        c.case_status,
        c.affected_items,
        c.evidence_gap,
        c.evidence_coverage_pct,
        c.review_focus,
        c.created_at,
        c.assigned_to,
        c.assigned_name,
        cl.total_amount,
        cl.claim_date,
        pr.provider_name,
        pr.provider_id,
        COALESCE(p.patient_id, e.patient_id, 'PAT-SYN-001') as patient_id,
        COALESCE(p.age_group, '45-59') as age_group,
        COALESCE(p.sex, 'L') as sex
      FROM cases c
      JOIN claims cl ON c.claim_id = cl.claim_id
      LEFT JOIN encounters e ON cl.encounter_id = e.encounter_id
      JOIN providers pr ON cl.provider_id = pr.provider_id
      LEFT JOIN patients p ON e.patient_id = p.patient_id
      ${baseWhere}
      ORDER BY 
        CASE 
          WHEN c.primary_risk_mode = 'PHANTOM_BILLING' THEN 1
          ELSE 2
        END,
        CASE 
          WHEN c.review_priority = 'HIGH' THEN 1
          WHEN c.review_priority = 'MEDIUM' THEN 2
          WHEN c.review_priority = 'NO_CONCLUSION' THEN 3
          ELSE 4
        END,
        c.case_id ASC
    `;

    const dataParams = [...params];
    if (limitNum) {
      dataParams.push(limitNum);
      query += ` LIMIT $${dataParams.length}`;
      dataParams.push(offset);
      query += ` OFFSET $${dataParams.length}`;
    }

    const res = await client.query(query, dataParams);
    return {
      cases: res.rows,
      total,
      page: pageNum,
      limit: limitNum || total,
      totalPages: limitNum ? Math.ceil(total / limitNum) : 1
    };
  } finally {
    client.release();
  }
}

export async function getCaseById(caseId) {
  const client = await pool.connect();
  try {
    // 1. Case info
    const caseRes = await client.query(`
      SELECT 
        c.*,
        cl.encounter_id,
        cl.claim_date,
        cl.claim_status,
        cl.total_amount,
        COALESCE(p.patient_id, e.patient_id, 'PAT-SYN-001') as patient_id,
        COALESCE(e.service_date, cl.claim_date, CURRENT_DATE) as service_date,
        COALESCE(e.encounter_type, 'RAWAT_INAP') as encounter_type,
        pr.provider_id,
        pr.provider_name,
        pr.provider_type,
        COALESCE(p.age_group, '45-59') as age_group,
        COALESCE(p.sex, 'L') as sex
      FROM cases c
      JOIN claims cl ON c.claim_id = cl.claim_id
      LEFT JOIN encounters e ON cl.encounter_id = e.encounter_id
      JOIN providers pr ON cl.provider_id = pr.provider_id
      LEFT JOIN patients p ON e.patient_id = p.patient_id
      WHERE c.case_id = $1
    `, [caseId]);

    if (caseRes.rows.length === 0) {
      return null;
    }
    const caseData = caseRes.rows[0];

    // 2. Diagnoses
    const dxRes = await client.query(
      'SELECT * FROM diagnoses WHERE encounter_id = $1 ORDER BY diagnosis_role ASC',
      [caseData.encounter_id]
    );

    // 3. Claim Items & Billing Items
    const itemsRes = await client.query(`
      SELECT 
        ci.*,
        COALESCE(
          (SELECT json_agg(b.*) FROM billing_items b WHERE b.claim_item_id = ci.claim_item_id),
          '[]'::json
        ) as billing_items
      FROM claim_items ci
      WHERE ci.claim_id = $1
      ORDER BY ci.sequence_no ASC
    `, [caseData.claim_id]);

    // 4. Evidence Links for these items
    const evidenceRes = await client.query(`
      SELECT el.*, ci.claim_id
      FROM evidence_links el
      JOIN claim_items ci ON el.claim_item_id = ci.claim_item_id
      WHERE ci.claim_id = $1
    `, [caseData.claim_id]);

    // 5. Risk Signals
    const signalsRes = await client.query(`
      SELECT * FROM risk_signals 
      WHERE claim_id = $1
      ORDER BY created_at ASC, signal_id ASC
    `, [caseData.claim_id]);

    // 6. Review Outcomes
    const outcomesRes = await client.query(`
      SELECT * FROM review_outcomes 
      WHERE case_id = $1 
      ORDER BY reviewed_at DESC
    `, [caseId]);

    // 7. Audit Logs
    const auditRes = await client.query(`
      SELECT * FROM audit_logs 
      WHERE case_id = $1 
      ORDER BY created_at DESC
    `, [caseId]);

    return {
      case: caseData,
      diagnoses: dxRes.rows,
      claimItems: itemsRes.rows,
      evidenceLinks: evidenceRes.rows,
      riskSignals: signalsRes.rows,
      reviewOutcomes: outcomesRes.rows,
      auditLogs: auditRes.rows
    };
  } finally {
    client.release();
  }
}

export async function getCaseEvidence(caseId) {
  const caseDetails = await getCaseById(caseId);
  if (!caseDetails) return null;

  // Build structured Evidence Chain:
  // Case -> Claim -> Items -> Evidence Links & Match Status
  const itemsChain = caseDetails.claimItems.map(item => {
    const matchedEvidence = caseDetails.evidenceLinks.filter(
      el => el.claim_item_id === item.claim_item_id
    );
    const relatedSignals = caseDetails.riskSignals.filter(
      rs => rs.claim_item_id === item.claim_item_id
    );

    const claimedQty = parseFloat(item.quantity);
    const supportedQty = matchedEvidence.reduce((acc, el) => acc + parseFloat(el.match_quantity || 0), 0);
    const gap = Math.max(0, claimedQty - supportedQty);
    const coverage = claimedQty > 0 ? (supportedQty / claimedQty) * 100 : 100;

    let itemStatus = 'SUPPORTED';
    if (matchedEvidence.some(el => el.availability === 'NO' || el.availability === 'UNAVAILABLE')) {
      itemStatus = 'UNAVAILABLE';
    } else if (supportedQty === 0) {
      itemStatus = 'UNSUPPORTED';
    } else if (supportedQty < claimedQty) {
      itemStatus = 'PARTIAL';
    }

    return {
      claimItemId: item.claim_item_id,
      sequenceNo: item.sequence_no,
      serviceCode: item.service_code,
      serviceType: item.service_type,
      claimedQuantity: claimedQty,
      unitPrice: parseFloat(item.unit_price),
      netAmount: parseFloat(item.net_amount),
      groundTruthStatus: item.ground_truth_item_status,
      calculatedStatus: itemStatus,
      supportedQuantity: supportedQty,
      evidenceGap: gap,
      coveragePct: Math.round(coverage * 100) / 100,
      evidenceLinks: matchedEvidence,
      riskSignals: relatedSignals
    };
  });

  return {
    caseId: caseDetails.case.case_id,
    claimId: caseDetails.case.claim_id,
    provider: {
      id: caseDetails.case.provider_id,
      name: caseDetails.case.provider_name
    },
    primaryRiskMode: caseDetails.case.primary_risk_mode,
    reviewPriority: caseDetails.case.review_priority,
    caseStatus: caseDetails.case.case_status,
    totalEvidenceGap: caseDetails.case.evidence_gap,
    evidenceCoveragePct: caseDetails.case.evidence_coverage_pct,
    reviewFocus: caseDetails.case.review_focus,
    claimLevelSignals: caseDetails.riskSignals.filter(rs => !rs.claim_item_id),
    items: itemsChain
  };
}

export async function submitCaseOutcome(caseId, { outcome, notes, reviewerId = 'reviewer-001' }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get current case
    const caseRes = await client.query('SELECT * FROM cases WHERE case_id = $1 FOR UPDATE', [caseId]);
    if (caseRes.rows.length === 0) {
      throw new Error(`Case not found: ${caseId}`);
    }
    const currentCase = caseRes.rows[0];
    const prevStatus = currentCase.case_status;

    // 2. Generate review_id
    const reviewId = `REV-${caseId}-${Date.now().toString().slice(-4)}`;
    
    // 3. Insert review outcome
    await client.query(`
      INSERT INTO review_outcomes (review_id, case_id, reviewer_id, outcome, notes, reviewed_at, data_status)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 'SYNTHETIC')
    `, [reviewId, caseId, reviewerId, outcome, notes]);

    // 4. Update case status based on outcome
    let newStatus = 'REVIEWED';
    if (outcome === 'NEEDS_MORE_EVIDENCE') {
      newStatus = 'NEEDS_MORE_EVIDENCE';
    } else if (outcome === 'CONFIRMED') {
      newStatus = 'CONFIRMED';
    } else if (outcome === 'FALSE_POSITIVE' || outcome === 'NOT_CONFIRMED') {
      newStatus = 'CLOSED';
    }

    await client.query(`
      UPDATE cases 
      SET case_status = $1 
      WHERE case_id = $2
    `, [newStatus, caseId]);

    // 5. Insert audit log
    const auditDetail = `Reviewer ${reviewerId} submitted outcome [${outcome}] with note: "${notes || '-'}" (Status transitioned from ${prevStatus} to ${newStatus})`;
    await client.query(`
      INSERT INTO audit_logs (case_id, actor_id, action, detail, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `, [caseId, reviewerId, 'SUBMIT_OUTCOME', auditDetail]);

    await client.query('COMMIT');

    return {
      reviewId,
      caseId,
      reviewerId,
      outcome,
      notes,
      previousStatus: prevStatus,
      newStatus,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function assignCaseReviewer(caseId, { assignedTo, assignedName, note, assignedBy = 'Staff JKN' }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      UPDATE cases
      SET assigned_to = $1, assigned_name = $2, case_status = 'IN_REVIEW'
      WHERE case_id = $3
    `, [assignedTo, assignedName, caseId]);

    const auditDetail = `Staff [${assignedBy}] menugaskan kasus ${caseId} kepada Tenaga Kesehatan [${assignedName} (${assignedTo})]. Catatan pengantar: "${note || 'Harap lakukan verifikasi klinis dan telaah rekam medis'}"`;
    await client.query(`
      INSERT INTO audit_logs (case_id, actor_id, action, detail, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `, [caseId, assignedBy, 'ASSIGN_REVIEWER', auditDetail]);

    await client.query('COMMIT');
    return {
      caseId,
      assignedTo,
      assignedName,
      status: 'IN_REVIEW',
      auditDetail
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
