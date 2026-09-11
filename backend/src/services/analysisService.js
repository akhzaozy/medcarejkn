import pool from '../config/db.js';
import { reconcileItem } from '../decision-engine/evidenceReconciliation.js';

export async function runFullAnalysis() {
  const client = await pool.connect();
  try {
    const startTime = Date.now();
    
    // Fetch all claims with items and evidence links
    const claimsRes = await client.query('SELECT claim_id FROM claims ORDER BY claim_id ASC');
    let analyzedCount = 0;
    let highRiskCount = 0;
    let noConclusionCount = 0;

    for (const row of claimsRes.rows) {
      const claimId = row.claim_id;
      // Get items and evidence
      const itemsRes = await client.query(`
        SELECT ci.claim_item_id, ci.quantity, el.availability, el.match_quantity
        FROM claim_items ci
        LEFT JOIN evidence_links el ON ci.claim_item_id = el.claim_item_id
        WHERE ci.claim_id = $1
      `, [claimId]);

      // Simple evaluation pass
      for (const item of itemsRes.rows) {
        const result = reconcileItem({
          claimedQty: item.quantity,
          supportedQty: item.match_quantity || 0,
          evidenceAvailable: item.availability || 'YES'
        });
        if (result.reviewPriority === 'HIGH') highRiskCount++;
        if (result.reviewPriority === 'NO_CONCLUSION') noConclusionCount++;
      }
      analyzedCount++;
    }

    // Add audit log entry
    await client.query(`
      INSERT INTO audit_logs (actor_id, action, detail, created_at)
      VALUES ('SYSTEM_ENGINE', 'RUN_ANALYSIS', $1, CURRENT_TIMESTAMP)
    `, [`Automated decision engine analysis executed across ${analyzedCount} claims in ${Date.now() - startTime}ms`]);

    return {
      status: 'success',
      claimsAnalyzed: analyzedCount,
      executionDurationMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  } finally {
    client.release();
  }
}
