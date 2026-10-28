import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {getMockCaseDetails,MOCK_VALIDATION} from '../../frontend/src/api/mockData.js';
import {login} from '../../backend/src/controllers/authController.js';
const read=p=>fs.readFileSync(p,'utf8');
const api=read('frontend/src/api/client.js'),queue=read('frontend/src/pages/CasesPage.jsx'),detail=read('frontend/src/pages/CaseDetailPage.jsx'),app=read('frontend/src/App.jsx');
const observations={};
const fallback=api.slice(api.indexOf('function generateMockAuditCheck('),api.indexOf('export async function loginUser'));
if(fallback){const result=vm.runInNewContext(`(${fallback.trim()})`)({saveCase:true});try{result.fraudType.toUpperCase();observations['BUG-01']='not reproduced';}catch(e){observations['BUG-01']=e.name+' from missing fallback fraudType';}}
observations['BUG-02']=queue.includes("riskMode: isClinician ? 'PHANTOM_BILLING'");
observations['BUG-03']=api.includes('claimItems: det.claimItems') && detail.includes('evidenceChain?.items');
observations['BUG-04']=queue.includes("assignedTo: 'dr.anindya'");
observations['BUG-05']=getMockCaseDetails('CASE-NONEXISTENT')?.case?.case_id;
observations['BUG-06']={normalModeUsesMemoryFallback:api.includes('return getFilteredMockCases(filters);'),schemaNotIdempotent:!read('database/schema.sql').includes('IF NOT EXISTS')};
observations['BUG-07']=app.includes("onOpenQueue={() => handleOpenBpjsAudit('Reguler','queue')}");
observations['BUG-08']={uiUsesLegacyFields:detail.includes('log.created_at')&&detail.includes('log.actor_id'),demoUsesDifferentFields:read('frontend/src/api/mockData.js').includes('timestamp:')};
let user;await login({body:{role:'staff_jkn'}},{status(){return this;},json(data){user=data.data?.user;}},()=>{});
observations['BUG-09']={responseContainsPassword:!!user&&Object.hasOwn(user,'password'),roleBypassesCredentials:!!user};
observations['BUG-10']={validationHasNoNavigation:!read('frontend/src/components/layout/MedcareHeader.jsx').includes('validation'),modalStateNeverOpened:!read('frontend/src/pages/MedcareMinimalistDashboard.jsx').includes('setIsScheduleOpen(true)')};
observations['BUG-11']=read('frontend/src/components/layout/MedcareHeader.jsx').includes('/assets/user_fedrik.jpg')&&!fs.existsSync('frontend/public/assets/user_fedrik.jpg');
observations['BUG-12']={stickyHeader:read('frontend/src/styles/medcare-minimalist.css').includes('position: sticky'),fixedResultOffset:read('frontend/src/pages/BpjsAuditPage.jsx').includes('scrollMarginTop:100')};
observations.validation={implementation:'rules without trained model',fallbackKeys:Object.keys(MOCK_VALIDATION),source:read('backend/src/services/validationService.js').includes('detectNhisFraud(row)')?'runtime rule evaluation over local CSV':'inspect'};
console.log(JSON.stringify(observations,null,2));
fs.writeFileSync('docs/execution/discovery-baseline.json',JSON.stringify(observations,null,2)+'\n');

