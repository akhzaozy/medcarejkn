import seeds from '../../../data/demo/cases.json' with {type:'json'};
import {users as identities} from '../../../shared/users.js';
import {analyzeClaim} from '../../../shared/riskEngine.js';
import {itemContract,evidenceContract,eventContract} from '../../../shared/caseContract.js';
export const MOCK_USERS=identities;
export const MOCK_CASES=seeds.map(d=>structuredClone(d.case));
export const CASE_DYNAMIC_STORE={};
export const MOCK_VALIDATION={available:false,engine:{type:'rule'},message:'Benchmark belum dimuat.'};
export function getMockCaseDetails(id){
  const original=seeds.find(d=>d.case.case_id===id);if(!original){const e=new Error('Kasus tidak ditemukan');e.status=404;throw e;}
  if(!CASE_DYNAMIC_STORE[id]){
    const d=structuredClone(original),c=MOCK_CASES.find(c=>c.case_id===id);
    const rawLinks=d.evidenceLinks.map((e,i)=>({...e,claim_item_id:d.claimItems[i]?.item_id,match_status:e.status==='AVAILABLE'?'MATCHED':'UNAVAILABLE',match_quantity:e.status==='AVAILABLE'?d.claimItems[i]?.quantity:0}));
    const evidenceLinks=rawLinks.map(evidenceContract),claimItems=d.claimItems.map(item=>itemContract(item,evidenceLinks));
    const analysis=analyzeClaim({evidenceAvailable:claimItems.every(i=>i.calculatedStatus!=='UNAVAILABLE'),claimedQty:claimItems.reduce((n,i)=>n+i.claimedQuantity,0),supportedQty:claimItems.reduce((n,i)=>n+i.supportedQuantity,0)});
    CASE_DYNAMIC_STORE[id]={...d,case:c,claimItems,evidenceLinks,auditLogs:[eventContract({eventId:'demo-created',caseId:id,type:'CASE_CREATED',actor:'system.seed',timestamp:new Date().toISOString()})],disputes:[],uploadedEvidences:[],riskAnalysis:analysis,initialAnalysis:analysis,scoreHistory:[],mlRecommendation:{modelName:analysis.engine.version,confidenceScore:analysis.riskScore,predictedRiskLevel:analysis.reviewPriority,suggestedOutcome:'NEEDS_MORE_EVIDENCE',suggestedNotes:'Draf — wajib ditinjau dokter. '+analysis.reasons.join('; '),drivers:analysis.reasons}};
  }return CASE_DYNAMIC_STORE[id];
}
export const MOCK_DASHBOARD={caseCount:MOCK_CASES.length,claimsAnalyzed:MOCK_CASES.length,financials:{totalBilled:MOCK_CASES.reduce((n,c)=>n+Number(c.total_amount),0),totalExposure:0},topCases:MOCK_CASES};
