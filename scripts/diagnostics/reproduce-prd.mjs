// Current smoke checks. The immutable pre-fix discovery record is in docs/execution/discovery-baseline.json.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getMockCaseDetails} from '../../frontend/src/api/mockData.js';
import {normalizeAuditResult,analyzeClaim} from '../../shared/riskEngine.js';
import {publicUser} from '../../shared/userIdentity.js';
const read=p=>fs.readFileSync(p,'utf8');
const api=read('frontend/src/api/client.js'),queue=read('frontend/src/pages/CasesPage.jsx');
assert.equal(typeof normalizeAuditResult({}).fraudType,'string');
assert.throws(()=>getMockCaseDetails('CASE-NONEXISTENT'));
assert.equal(queue.includes("riskMode: isClinician ? 'PHANTOM_BILLING'"),false);
assert.equal(queue.includes("assignedTo: 'dr.anindya'"),false);
assert.equal(Object.hasOwn(publicUser({username:'demo',password:'redacted'}),'password'),false);
assert.equal(analyzeClaim({amountBilled:0}).riskScore,0);
assert.ok(api.includes('isDemoMode()'));
console.log('Current static smoke checks passed. For baseline see docs/execution/discovery-baseline.json; for API/DB run npm --prefix backend test.');
