import catalog from '../config/risk_rules.json' with {type:'json'};
export const engine={type:'rule',version:catalog.version};
export {catalog};
const available=v=>v!==null&&v!==undefined&&v!=='';
export function analyzeClaim(input={},configuration=catalog) {
  const f={...input};
  f.unsupportedQuantity=f.evidenceAvailable===true&&available(f.claimedQty)&&available(f.supportedQty)?Math.max(0,Number(f.claimedQty)-Number(f.supportedQty)):null;
  const signals=configuration.rules.filter(rule=>rule.requiredFields.every(key=>available(f[key])) && available(f[rule.field]) && (rule.operator==='gt'?Number(f[rule.field])>rule.threshold:f[rule.field]===rule.threshold)).map(rule=>({id:rule.id,label:rule.label,compared:rule.requiredFields,observedValue:f[rule.field],expected:rule.threshold,rawWeight:rule.weight,contribution:rule.weight,contributionType:'rule_weight',dataStatus:'available',nextAction:rule.nextAction,fraudType:rule.fraudType}));
  const sum=signals.reduce((n,s)=>n+s.rawWeight,0),riskScore=Math.min(100,sum);
  for(const signal of signals)signal.contribution=sum>100?signal.rawWeight*100/sum:signal.rawWeight;
  const evidenceKnown=f.evidenceAvailable===true&&available(f.claimedQty)&&available(f.supportedQty);
  const missingFields=[...new Set(configuration.rules.flatMap(r=>r.requiredFields))].filter(key=>!available(f[key]));
  if(!signals.length)signals.push({id:evidenceKnown?'EVIDENCE-COMPLETE':'EVIDENCE-MISSING',label:evidenceKnown?'Bukti tercatat mendukung kuantitas layanan':'Bukti belum tersedia untuk disimpulkan',compared:['evidenceAvailable','claimedQty','supportedQty'],observedValue:evidenceKnown?Number(f.supportedQty):null,expected:evidenceKnown?Number(f.claimedQty):'Bukti layanan',contribution:0,rawWeight:0,contributionType:'rule_weight',dataStatus:evidenceKnown?'available':'missing',nextAction:evidenceKnown?'Tinjau kesesuaian sumber bukti.':'Minta bukti layanan, tanpa menyimpulkan fraud.'});
  const main=signals.find(s=>s.fraudType),reviewPriority=riskScore>=60?'HIGH':riskScore>=30?'MEDIUM':!evidenceKnown?'NO_CONCLUSION':'LOW';
  return {riskScore,riskLevel:riskScore>=60?'HIGH':riskScore>=30?'MEDIUM':!evidenceKnown?'UNAVAILABLE':'LOW',reviewPriority,primaryRiskMode:main?.fraudType||(!evidenceKnown?'UNAVAILABLE':'NO_FRAUD'),fraudType:main?.fraudType||(!evidenceKnown?'Bukti belum tersedia':'No Fraud'),isPhantom:main?.fraudType==='PHANTOM_BILLING',reasons:signals.map(s=>s.label),reviewFocus:signals.map(s=>s.nextAction).join(' '),evidenceCoveragePct:evidenceKnown?Math.min(100,Math.round(Number(f.supportedQty)/Math.max(1,Number(f.claimedQty))*100)):null,evidenceGap:evidenceKnown?Math.max(0,Number(f.claimedQty)-Number(f.supportedQty)):null,engine:{type:'rule',version:configuration.version},signals,missingFields,scoreDefinition:configuration.aggregation};
}
export function auditResponse(input,save={status:'not_requested',caseId:null,message:'Tidak disimpan (opsi simpan dimatikan).'}) {return {success:true,analysis:analyzeClaim(input),save};}
export function normalizeAuditResult(payload={}) {
  const a={...analyzeClaim({}),...(payload.analysis||payload.data||payload)};
  a.fraudType=typeof a.fraudType==='string'?a.fraudType:'Bukti belum tersedia';
  a.reasons=Array.isArray(a.reasons)?a.reasons:[];
  const save=payload.save||{status:a.savedRecord?'saved':'not_requested',caseId:a.savedRecord?.caseId||null,message:'Tidak disimpan (opsi simpan dimatikan).'};
  return {...a,save,savedRecord:save.status==='saved'?{caseId:save.caseId,claimId:save.claimId}:null};
}
