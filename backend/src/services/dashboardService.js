import pool from '../config/db.js';

// All dashboard values come from the same role-scoped queue, including zero counts.
export async function getDashboardMetrics({assignedTo, role}={}) {
  const personal=role==='clinical_reviewer';
  const params=personal?[assignedTo]:[];
  const where=personal?'WHERE c.assigned_to=$1':'';
  const scoped=`SELECT c.*,cl.total_amount,p.provider_name FROM cases c LEFT JOIN claims cl ON cl.claim_id=c.claim_id LEFT JOIN providers p ON p.provider_id=cl.provider_id ${where}`;
  const client=await pool.connect();
  try {
    const aggregate=await client.query(`WITH scoped AS (${scoped}) SELECT COUNT(*)::int AS count,COUNT(DISTINCT claim_id)::int AS claims,COUNT(*) FILTER(WHERE review_priority='HIGH' AND case_status NOT IN('CONFIRMED','NOT_CONFIRMED','FALSE_POSITIVE','CLOSED'))::int AS high,COUNT(*) FILTER(WHERE case_status IN('CONFIRMED','NOT_CONFIRMED','FALSE_POSITIVE','CLOSED'))::int AS completed,COUNT(*) FILTER(WHERE case_status='IN_REVIEW')::int AS reviewing,COUNT(*) FILTER(WHERE assigned_to IS NULL)::int AS unassigned,COUNT(*) FILTER(WHERE evidence_coverage_pct IS NOT NULL AND case_type='claim')::int AS measured,AVG(evidence_coverage_pct) FILTER(WHERE case_type='claim') AS coverage,SUM(total_amount) AS billed FROM scoped`,params);
    const a=aggregate.rows[0];
    const top=await client.query(`WITH scoped AS (${scoped}) SELECT * FROM scoped WHERE case_status NOT IN('CONFIRMED','NOT_CONFIRMED','FALSE_POSITIVE','CLOSED') ORDER BY CASE review_priority WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 WHEN 'NO_CONCLUSION' THEN 2 ELSE 3 END,risk_score DESC NULLS LAST,created_at DESC,case_id LIMIT 4`,params);
    const monthly=await client.query(`WITH scoped AS (${scoped}), periods AS(SELECT generate_series(date_trunc('month',CURRENT_TIMESTAMP)-INTERVAL '5 months',date_trunc('month',CURRENT_TIMESTAMP),INTERVAL '1 month') AS month) SELECT to_char(p.month,'YYYY-MM') AS period,COUNT(s.case_id)::int AS count,COUNT(s.case_id) FILTER(WHERE s.review_priority='HIGH')::int AS high FROM periods p LEFT JOIN scoped s ON date_trunc('month',s.created_at)=p.month GROUP BY p.month ORDER BY p.month`,params);
    const schedule=await client.query(`SELECT d.id,d.case_id,d.payload,d.created_at FROM case_documents d JOIN cases c ON c.case_id=d.case_id WHERE d.kind='schedule' ${personal?'AND c.assigned_to=$1':''} ORDER BY d.created_at DESC LIMIT 3`,params);
    const statuses=await client.query(`WITH scoped AS (${scoped}) SELECT case_status,COUNT(*)::int AS count FROM scoped GROUP BY case_status`,params);
    return {isClinician:personal,assignedTo,claimsAnalyzed:a.claims,caseCount:a.count,highPriorityCases:a.high,pendingReview:a.count-a.completed,completedReview:a.completed,reviewing:a.reviewing,unassigned:a.unassigned,evidenceCoverage:a.coverage===null?null:Number(a.coverage),measuredCases:a.measured,financials:{totalBilled:Number(a.billed||0),totalExposure:null},topCases:top.rows,monthly:monthly.rows,schedules:schedule.rows,statuses:Object.fromEntries(statuses.rows.map(r=>[r.case_status,r.count])),dataStatus:'PERSISTED_QUEUE'};
  }finally{client.release();}
}
