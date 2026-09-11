import pool from '../config/db.js';

export async function getDashboardMetrics({ assignedTo, role } = {}) {
  const client = await pool.connect();
  try {
    const isClinician = role === 'clinical_reviewer' || Boolean(assignedTo);

    if (isClinician && assignedTo) {
      // ---------------- DASHBOARD KHUSUS DOKTER (PERSONALIZED & FOKUS PHANTOM BILLING) ----------------
      const casesRes = await client.query(
        'SELECT COUNT(*) FROM cases WHERE assigned_to = $1',
        [assignedTo]
      );
      const caseCount = parseInt(casesRes.rows[0].count, 10);

      // Kasus Phantom Billing dokter ini
      const phantomRes = await client.query(
        "SELECT COUNT(*), SUM(COALESCE(evidence_gap, 0)) as total_gap FROM cases WHERE assigned_to = $1 AND primary_risk_mode = 'PHANTOM_BILLING'",
        [assignedTo]
      );
      const phantomCount = parseInt(phantomRes.rows[0].count, 10);
      const phantomExposure = parseFloat(phantomRes.rows[0].total_gap || 0);

      // Status telaah dokter
      const statusRes = await client.query(`
        SELECT case_status, COUNT(*) as count
        FROM cases
        WHERE assigned_to = $1
        GROUP BY case_status
      `, [assignedTo]);

      const statusMap = {
        OPEN: 0,
        IN_REVIEW: 0,
        CONFIRMED: 0,
        NOT_CONFIRMED: 0,
        CLOSED: 0
      };
      statusRes.rows.forEach(r => {
        statusMap[r.case_status] = parseInt(r.count, 10);
      });

      // Total nominal klaim yang diaudit dokter ini
      const amountRes = await client.query(`
        SELECT SUM(cl.total_amount) as total_billed
        FROM cases c
        JOIN claims cl ON c.claim_id = cl.claim_id
        WHERE c.assigned_to = $1
      `, [assignedTo]);
      const totalBilled = parseFloat(amountRes.rows[0].total_billed || 0);

      // Kasus dokter ini (Fokus Phantom Billing ditampilkan di awal)
      const doctorCasesRes = await client.query(`
        SELECT 
          c.case_id, c.claim_id, c.primary_risk_mode, c.review_priority, 
          c.case_status, c.evidence_gap, c.evidence_coverage_pct, c.review_focus,
          c.assigned_to, c.assigned_name,
          cl.total_amount, p.provider_name
        FROM cases c
        JOIN claims cl ON c.claim_id = cl.claim_id
        JOIN providers p ON cl.provider_id = p.provider_id
        WHERE c.assigned_to = $1
        ORDER BY 
          CASE WHEN c.primary_risk_mode = 'PHANTOM_BILLING' THEN 1 ELSE 2 END,
          CASE WHEN c.case_status = 'IN_REVIEW' THEN 1 WHEN c.case_status = 'OPEN' THEN 2 ELSE 3 END,
          c.case_id ASC
        LIMIT 20
      `, [assignedTo]);

      return {
        isClinician: true,
        assignedTo,
        claimsAnalyzed: caseCount,
        caseCount,
        phantomCases: phantomCount,
        pendingReview: (statusMap.OPEN || 0) + (statusMap.IN_REVIEW || 0),
        completedReview: (statusMap.CONFIRMED || 0) + (statusMap.NOT_CONFIRMED || 0) + (statusMap.CLOSED || 0),
        highPriorityCases: phantomCount,
        riskModeBreakdown: {
          PHANTOM_BILLING: phantomCount,
          WRONG_DIAGNOSIS: 0,
          GHOST_ENROLLEE: 0
        },
        financials: {
          totalBilled,
          totalExposure: phantomExposure
        },
        topCases: doctorCasesRes.rows,
        dataStatus: 'DOCTOR_PERSONALIZED_PHANTOM'
      };
    }

    // ---------------- DASHBOARD GLOBAL (STAFF JKN / VERIFIKATOR PUSAT) ----------------
    // 1. Total claims
    const claimsRes = await client.query('SELECT COUNT(*) FROM claims');
    const claimsAnalyzed = parseInt(claimsRes.rows[0].count, 10);

    // 2. Total cases
    const casesRes = await client.query('SELECT COUNT(*) FROM cases');
    const caseCount = parseInt(casesRes.rows[0].count, 10);

    // 3. Priority breakdown
    const priorityRes = await client.query(`
      SELECT review_priority, COUNT(*) as count 
      FROM cases 
      GROUP BY review_priority
    `);
    const priorityMap = {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      NO_CONCLUSION: 0
    };
    priorityRes.rows.forEach(r => {
      priorityMap[r.review_priority] = parseInt(r.count, 10);
    });

    // 4. Status distribution across claims
    const statusRes = await client.query(`
      SELECT 
        COALESCE(ground_truth_item_status, 'UNKNOWN') as status, 
        COUNT(DISTINCT claim_id) as claim_count
      FROM claim_items
      GROUP BY ground_truth_item_status
    `);
    const statusMap = {
      SUPPORTED: 0,
      PARTIAL: 0,
      UNSUPPORTED: 0,
      UNAVAILABLE: 0
    };
    statusRes.rows.forEach(r => {
      if (statusMap[r.status] !== undefined) {
        statusMap[r.status] = parseInt(r.claim_count, 10);
      }
    });

    // 5. Fraud Type / Risk Mode breakdown
    const riskModeRes = await client.query(`
      SELECT primary_risk_mode, COUNT(*) as count, SUM(COALESCE(evidence_gap, 0)) as total_exposure
      FROM cases
      GROUP BY primary_risk_mode
    `);
    const riskModeBreakdown = {
      PHANTOM_BILLING: 0,
      WRONG_DIAGNOSIS: 0,
      GHOST_ENROLLEE: 0
    };
    let totalExposure = 0;
    riskModeRes.rows.forEach(r => {
      if (riskModeBreakdown[r.primary_risk_mode] !== undefined) {
        riskModeBreakdown[r.primary_risk_mode] = parseInt(r.count, 10);
      }
      totalExposure += parseFloat(r.total_exposure || 0);
    });

    // 6. Total Amount Billed
    const amountRes = await client.query('SELECT SUM(total_amount) as total_billed FROM claims');
    const totalBilled = parseFloat(amountRes.rows[0].total_billed || 0);

    // 7. Recent / Top Priority cases (Fokus Phantom Billing di posisi atas)
    const topCasesRes = await client.query(`
      SELECT 
        c.case_id, c.claim_id, c.primary_risk_mode, c.review_priority, 
        c.case_status, c.evidence_gap, c.evidence_coverage_pct, c.review_focus,
        c.assigned_to, c.assigned_name,
        cl.total_amount, p.provider_name
      FROM cases c
      JOIN claims cl ON c.claim_id = cl.claim_id
      JOIN providers p ON cl.provider_id = p.provider_id
      ORDER BY 
        CASE WHEN c.primary_risk_mode = 'PHANTOM_BILLING' THEN 1 ELSE 2 END,
        CASE 
          WHEN c.review_priority = 'HIGH' THEN 1
          WHEN c.review_priority = 'MEDIUM' THEN 2
          WHEN c.review_priority = 'NO_CONCLUSION' THEN 3
          ELSE 4
        END,
        c.case_id ASC
      LIMIT 10
    `);

    return {
      isClinician: false,
      claimsAnalyzed,
      caseCount,
      highPriorityCases: priorityMap.HIGH,
      mediumPriorityCases: priorityMap.MEDIUM,
      noConclusionCases: priorityMap.NO_CONCLUSION,
      lowPriorityCases: priorityMap.LOW,
      riskModeBreakdown,
      financials: {
        totalBilled,
        totalExposure
      },
      distribution: {
        SUPPORTED: statusMap.SUPPORTED || 0,
        PARTIAL: statusMap.PARTIAL || 0,
        UNSUPPORTED: statusMap.UNSUPPORTED || caseCount,
        UNAVAILABLE: statusMap.UNAVAILABLE || 0
      },
      topCases: topCasesRes.rows,
      dataStatus: 'VERIFIED_NHIS'
    };
  } finally {
    client.release();
  }
}
