import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {thresholdMetrics,curveMetrics} from '../../shared/metrics.js';
import {analyzeClaim,catalog} from '../../shared/riskEngine.js';
import {evidenceGapReport} from '../../shared/evidenceCopilot.js';
import {analyzeMonthlyPatterns,bpjsPatterns} from '../src/services/bpjsAnomalyService.js';
test('F3: known metrics, ties, capacity and deterministic benchmark',()=>{
  const rows=[{id:'a',label:1,score:90},{id:'b',label:0,score:80},{id:'c',label:1,score:60},{id:'d',label:0,score:20}];
  const m=thresholdMetrics(rows,70,2);assert.equal(m.tp,1);assert.equal(m.fp,1);assert.equal(m.fn,1);assert.equal(m.precisionAtK,.5);assert.equal(thresholdMetrics(rows,70,1).precisionAtK,1);assert.equal(curveMetrics(rows).rocAuc,.75);
  const root=fileURLToPath(new URL('../../',import.meta.url)),reportPath=new URL('../../data/benchmark/validation_report.json',import.meta.url);
  const before=JSON.parse(fs.readFileSync(reportPath));execFileSync(process.execPath,['scripts/evaluate/run.mjs'],{cwd:root,stdio:'pipe'});const after=JSON.parse(fs.readFileSync(reportPath));assert.equal(after.datasetHash,before.datasetHash);assert.deepEqual(after.metrics,before.metrics);assert.deepEqual(after.predictions,before.predictions);assert.equal(after.leakageChecks.disjointGroups,true);assert.equal(after.trainingUsed,false);
});
test('F4: configured weight changes actual score and explanations sum to score',()=>{const input={evidenceAvailable:true,claimedQty:2,supportedQty:0};const modified=structuredClone(catalog);modified.rules[0].weight=15;assert.equal(analyzeClaim(input,modified).riskScore,15);for(const values of [input,{...input,duplicateCount:2}]){const a=analyzeClaim(values);assert.ok(Math.abs(a.signals.reduce((sum,s)=>sum+s.contribution,0)-a.riskScore)<1e-9);assert.ok(a.signals.every(s=>s.contributionType==='rule_weight'));}});
test('F5: copilot is sourced, deterministic and requires matching metadata, not filename presence',()=>{const d={case:{case_id:'case'},claimItems:[{claimItemId:'i',serviceCode:'PROC-47.01',serviceType:'PROCEDURE'}],evidenceLinks:[]};const missing=evidenceGapReport(d);assert.equal(missing.gaps.length,2);assert.ok(missing.gaps.every(g=>g.source.ruleId&&g.source.claimItemId));const pending=evidenceGapReport({...d,evidenceLinks:[{evidenceId:'e',claimItemId:'i',type:'SURGICAL_REPORT',reference:'Ref',availability:'YES',matchStatus:'PENDING'}]});assert.equal(pending.gaps.find(g=>g.type==='SURGICAL_REPORT').status,'pending_review');assert.equal(evidenceGapReport({...d,evidenceLinks:[{evidenceId:'e',claimItemId:'i',type:'SURGICAL_REPORT',reference:'Ref',availability:'YES',matchStatus:'MATCHED'}]}).gaps.length,1);assert.equal(missing.scope,'structured_metadata_only');});
test('F6: rolling baseline excludes present/future and reports source fields',()=>{const rows=[10,12,10,50].map((n,i)=>({tableId:'t',cohort:'test',kind:'fkrtl',period:`2025-0${i+1}`,rows:n,billed:n*100,billedCount:n}));const report=analyzeMonthlyPatterns(rows);const signal=report.anomalies.find(a=>a.metric==='rows');assert.ok(signal);assert.equal(signal.baseline,10);assert.deepEqual(signal.comparisonPeriods,['2025-01','2025-02','2025-03']);assert.ok(signal.actual&&signal.method&&signal.reason);assert.equal(analyzeMonthlyPatterns(rows.slice(0,2)).anomalies.length,0);});
test('F5: all eight seeded cases retain configured, sourced evidence requirements',async()=>{
  const {getMockCaseDetails}=await import('../../frontend/src/api/mockData.js');
  for(let i=1;i<=8;i++){
    const report=evidenceGapReport(getMockCaseDetails(`CASE-PB-${String(i).padStart(3,'0')}`));
    assert.equal(report.gaps.length,[3,4,6].includes(i)?6:3);
    assert.ok(report.gaps.every(g=>g.source.ruleId&&g.source.ruleVersion&&g.source.claimItemId));
    assert.equal(report.draft.includes('fraud terbukti'),false);
  }
});
