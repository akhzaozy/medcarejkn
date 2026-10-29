import fs from 'node:fs';import {fileURLToPath} from 'node:url';import path from 'node:path';import {createHash} from 'node:crypto';
import {analyzeClaim,catalog} from '../../shared/riskEngine.js';
import {thresholdMetrics,curveMetrics,seededRandom} from '../../shared/metrics.js';
const directory=fileURLToPath(new URL('../../data/benchmark/',import.meta.url));fs.mkdirSync(directory,{recursive:true});
const seed=29102026,random=seededRandom(seed),rows=[];
for(let i=0;i<800;i++){
  const kind=i%20,qty=1+Math.floor(random()*4);let scenario='complete',label=0,features={evidenceAvailable:true,claimedQty:qty,supportedQty:qty,amountBilled:Math.round(random()*1000000)};
  if(kind<3){scenario='unsupported';label=1;features.supportedQty=0;}
  else if(kind===3){scenario='hidden_unsupported';label=1;features.evidenceAvailable=false;features.supportedQty=null;}
  else if(kind===4){scenario='tariff_gap';label=1;features.tariffGap=100+Math.round(random()*1000);}
  else if(kind===5){scenario='conflicting_admin_duplicate';features.duplicateCount=2;}
  else if(kind<9){scenario='missing_but_legitimate';features.evidenceAvailable=false;features.supportedQty=null;}
  else if(kind===9){scenario='zero_billing_legitimate';features.amountBilled=0;}
  rows.push({id:`SYN-${String(i+1).padStart(4,'0')}`,groupId:`GROUP-${i+1}`,scenario,label,features});
}
const shuffled=[...rows];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
const split=Math.floor(rows.length*.7),train=shuffled.slice(0,split),test=shuffled.slice(split),dataset={version:'synthetic-1.0.0',seed,labelDefinition:'1 = unsupported service or explicitly mismatched tariff in a synthetic scenario; not an adjudicated JKN fraud label',trainIds:train.map(r=>r.id),testIds:test.map(r=>r.id),rows};
const serialized=JSON.stringify(dataset,null,2)+'\n',datasetHash=createHash('sha256').update(serialized).digest('hex');fs.writeFileSync(path.join(directory,'synthetic.json'),serialized);
const predictions=test.map(r=>({...r,score:analyzeClaim(r.features).riskScore,signals:analyzeClaim(r.features).signals.map(s=>s.id)}));
const metrics={...thresholdMetrics(predictions,60,20),...curveMetrics(predictions)};
const samples=[];const bootstrap=seededRandom(seed+1);for(let i=0;i<200;i++){const draw=Array.from({length:predictions.length},()=>predictions[Math.floor(bootstrap()*predictions.length)]);samples.push({...thresholdMetrics(draw,60,20),...curveMetrics(draw)});}
const intervals={};for(const name of ['precision','recall','prAuc','rocAuc']){const values=samples.map(s=>s[name]).filter(v=>v!=null).sort((a,b)=>a-b);intervals[name]=[values[Math.floor(values.length*.025)],values[Math.floor(values.length*.975)]];}
const fields=[...new Set(catalog.rules.flatMap(r=>r.requiredFields))],quality=fields.map(field=>{const missing=test.filter(r=>r.features[field]==null).length;const outOfRange=test.filter(r=>typeof r.features[field]==='number'&&(!Number.isFinite(r.features[field])||r.features[field]<0)).length;return {field,missing,missingPct:missing/test.length*100,outOfRange,discarded:0};});
const report={version:'benchmark-1.0.0',engine:{type:'rule',version:catalog.version},evaluatedAt:new Date().toISOString(),seed,datasetHash,ruleConfigHash:createHash('sha256').update(JSON.stringify(catalog)).digest('hex'),labelSource:'synthetic_scenarios',syntheticWarning:'Label berasal dari skenario sintetis. Tidak mencerminkan akurasi deteksi fraud pada data JKN nyata.',trainSize:train.length,testSize:test.length,trainingUsed:false,preprocessing:'Tidak ada fitting atau imputasi. Split grup dilakukan sebelum evaluasi; label/scenario/id tidak diberikan ke scoring.',leakageChecks:{disjointGroups:!train.some(a=>test.some(b=>a.groupId===b.groupId)),labelExcluded:true},positiveDefinition:dataset.labelDefinition,metrics,bootstrap:{iterations:200,confidence:.95,intervals},methods:[{type:'rule',available:true,metrics},{type:'ml',available:false,reason:'Belum ada model ML terlatih.'},{type:'hybrid',available:false,reason:'Belum ada komponen ML terlatih.'}],scenarios:[...new Set(predictions.map(r=>r.scenario))].map(scenario=>({scenario,count:predictions.filter(r=>r.scenario===scenario).length,...thresholdMetrics(predictions.filter(r=>r.scenario===scenario),60,20)})),quality,predictions,errorAnalysis:{falsePositives:predictions.filter(r=>r.score>=60&&!r.label).slice(0,5),falseNegatives:predictions.filter(r=>r.score<60&&r.label).slice(0,5),evidenceCompletion:{before:analyzeClaim({evidenceAvailable:true,claimedQty:2,supportedQty:0}),after:analyzeClaim({evidenceAvailable:true,claimedQty:2,supportedQty:2})}}};
fs.writeFileSync(path.join(directory,'validation_report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({datasetHash,trainSize:train.length,testSize:test.length,prAuc:metrics.prAuc,precisionAtK:metrics.precisionAtK,leakageChecks:report.leakageChecks}));
