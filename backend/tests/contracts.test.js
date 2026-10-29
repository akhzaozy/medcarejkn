import {fileURLToPath} from 'node:url';
import test from 'node:test';import assert from 'node:assert/strict';
import {analyzeClaim,auditResponse,normalizeAuditResult} from '../../shared/riskEngine.js';
import {publicUser} from '../../shared/userIdentity.js';
import {itemContract,eventContract} from '../../shared/caseContract.js';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../frontend/package.json',import.meta.url));
test('BUG-01: fallback and partial result render without throwing',async()=>{
  for(const payload of [{},{fraudType:null,reasons:null},auditResponse({evidenceAvailable:false})]){const x=normalizeAuditResult(payload);assert.equal(typeof x.fraudType,'string');assert.ok(Array.isArray(x.reasons));}
  const esbuild=require('esbuild'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
  const compiled=await esbuild.build({entryPoints:[fileURLToPath(new URL('../../frontend/src/components/common/AuditResultHeadline.jsx',import.meta.url))],bundle:true,write:false,platform:'node',format:'cjs',external:['react']});
  const module={exports:{}};new Function('require','module','exports',compiled.outputFiles[0].text)(require,module,module.exports);
  for(const value of [null,{}, {fraudType:null}])assert.ok(renderToStaticMarkup(React.createElement(module.exports.default,{analysis:value})).length>0);
});
test('BUG-03/08: canonical evidence and event contract preserve missing status and quantity zero',()=>{const row={claim_item_id:'i',quantity:1,net_amount:0};const item=itemContract(row,[]);assert.equal(item.calculatedStatus,'UNAVAILABLE');assert.equal(item.netAmount,0);const event=eventContract({audit_id:1,actor_id:'reviewer',created_at:'2026-10-29T00:00:00Z',action:'TEST'});assert.equal(event.actor.username,'reviewer');assert.ok(event.timestamp);});
test('rule score is explainable, zero billing alone is not an anomaly',()=>{assert.equal(analyzeClaim({amountBilled:0}).riskScore,0);const a=analyzeClaim({evidenceAvailable:true,claimedQty:3,supportedQty:1,duplicateCount:2});assert.ok(Math.abs(a.signals.reduce((n,s)=>n+s.contribution,0)-a.riskScore)<1e-9);assert.equal(a.engine.type,'rule');});

test('verified evidence supersedes unavailable references and duplicate documents do not inflate quantity',()=>{const row={claim_item_id:'i',quantity:2};const links=[{claim_item_id:'i',availability:'UNAVAILABLE',match_status:'UNAVAILABLE'},{claim_item_id:'i',availability:'YES',match_status:'MATCHED',match_quantity:1},{claim_item_id:'i',availability:'YES',match_status:'MATCHED',match_quantity:1}];const item=itemContract(row,links);assert.equal(item.calculatedStatus,'PARTIAL');assert.equal(item.supportedQuantity,1);assert.equal(item.coveragePct,50);});
