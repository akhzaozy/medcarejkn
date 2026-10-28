import {MOCK_DASHBOARD,MOCK_CASES,MOCK_USERS,getMockCaseDetails} from './mockData';
import {auditResponse,normalizeAuditResult} from '../../../shared/riskEngine.js';
import {publicUser} from '../../../shared/userIdentity.js';
export {getNotifications,addNotification,markNotificationsAsRead} from './notifications';
const API_BASE=import.meta.env.VITE_API_BASE_URL||'/api';
export function isDemoMode(){try{return localStorage.getItem('jkn_demo_mode')==='true';}catch{return false;}}
export function setDemoMode(value){if(value)localStorage.setItem('jkn_demo_mode','true');else localStorage.removeItem('jkn_demo_mode');}
export async function apiRequest(route,{method='GET',body,signal}={}) {
  let response;try{response=await fetch(API_BASE+route,{method,signal,headers:{...(body?{'Content-Type':'application/json'}:{}),...(localStorage.getItem('jkn_token')?{Authorization:`Bearer ${localStorage.getItem('jkn_token')}`}:{})},...(body?{body:JSON.stringify(body)}:{})});}catch(e){if(e.name==='AbortError')throw e;throw new Error('Layanan tidak dapat dihubungi. Perubahan belum disimpan.');}
  const data=await response.json().catch(()=>({}));if(!response.ok){if(response.status===401&&!route.startsWith('/auth/'))window.dispatchEvent(new Event('jkn_session_expired'));const error=new Error(data.message||'Permintaan belum berhasil. Silakan coba lagi.');error.status=response.status;throw error;}return data;
}
function filtered(filters={}){let cases=MOCK_CASES.filter(c=>(!filters.assignedTo||filters.assignedTo==='ALL'||(filters.assignedTo==='UNASSIGNED'?!c.assigned_to:c.assigned_to===filters.assignedTo))&&(!filters.riskMode||filters.riskMode==='ALL'||c.primary_risk_mode===filters.riskMode)&&(!filters.status||filters.status==='ALL'||c.case_status===filters.status)&&(!filters.priority||filters.priority==='ALL'||c.review_priority===filters.priority)&&(!filters.search||JSON.stringify(c).toLowerCase().includes(filters.search.toLowerCase())));const limit=filters.limit==='ALL'?Math.max(1,cases.length):Math.max(1,Number(filters.limit)||12),page=Math.max(1,Number(filters.page)||1);return {data:cases.slice((page-1)*limit,page*limit),total:cases.length,totalPages:Math.max(1,Math.ceil(cases.length/limit)),page};}
export async function fetchDashboard(params={}){if(isDemoMode()){const cases=filtered({...params,limit:'ALL'}).data;return {...MOCK_DASHBOARD,caseCount:cases.length,claimsAnalyzed:cases.length,topCases:cases};}return (await apiRequest('/dashboard?'+new URLSearchParams(params))).data;}
export async function fetchCases(filters={}){return isDemoMode()?filtered(filters):apiRequest('/cases?'+new URLSearchParams(filters));}
export async function fetchCaseDetails(id){return isDemoMode()?getMockCaseDetails(id):(await apiRequest('/cases/'+encodeURIComponent(id))).data;}
export async function fetchCaseEvidence(id){if(isDemoMode()){const d=getMockCaseDetails(id);return {caseId:id,claimItems:d.claimItems,evidenceLinks:d.evidenceLinks};}return (await apiRequest(`/cases/${encodeURIComponent(id)}/evidence`)).data;}
export async function auditCheckClaim(input){
  if(isDemoMode())return normalizeAuditResult(auditResponse(input,{status:input.saveCase?'failed':'not_requested',caseId:null,message:input.saveCase?'Analisis selesai dalam mode demo. Kasus tidak disimpan ke server.':'Tidak disimpan (opsi simpan dimatikan).'}));
  try{return normalizeAuditResult(await apiRequest('/claims/audit-check',{method:'POST',body:input}));}catch{return normalizeAuditResult(auditResponse(input,{status:input.saveCase?'failed':'not_requested',caseId:null,message:input.saveCase?'Analisis lokal berhasil, tetapi kasus belum tersimpan karena layanan tidak tersedia.':'Analisis lokal; opsi simpan dimatikan.'}));}
}
export async function loginUser(credentials){const result=await apiRequest('/auth/login',{method:'POST',body:credentials});setDemoMode(false);return {...result.data,user:publicUser(result.data.user)};}
export async function fetchRoles(){return (await apiRequest('/auth/roles')).data;}
export async function logoutUser(){if(!isDemoMode()&&localStorage.getItem('jkn_token'))await apiRequest('/auth/logout',{method:'POST'}).catch(()=>{});}
const demoEvent=(d,type,details)=>d.auditLogs.unshift({eventId:`local-${Date.now()}`,caseId:d.case.case_id,type,timestamp:new Date().toISOString(),actor:publicUser(JSON.parse(localStorage.getItem('jkn_user')||'{}')),details});
async function mutate(id,action,payload={}){
  if(!isDemoMode())return (await apiRequest(`/cases/${encodeURIComponent(id)}/${action}`,{method:'POST',body:payload})).data;
  const d=getMockCaseDetails(id);const user=JSON.parse(localStorage.getItem('jkn_user')||'{}');
  if(action==='outcome'){if(user.role!=='clinical_reviewer')throw new Error('Hanya dokter penelaah yang dapat menetapkan keputusan.');d.reviewOutcomes.unshift({outcome:payload.outcome,notes:payload.notes,reviewed_at:new Date().toISOString(),reviewer_id:user.username});d.case.case_status=payload.outcome==='NOT_CONFIRMED'?'NOT_CONFIRMED':payload.outcome;}
  if(action==='assign'){d.case.assigned_to=payload.assignedTo;d.case.assigned_name=MOCK_USERS.find(u=>u.username===payload.assignedTo)?.name;d.case.case_status='IN_REVIEW';}
  if(action==='ownership')d.case.staff_handler=user.name;
  if(action==='dispute'||action==='clarification'){d.disputes.unshift({id:`local-${Date.now()}`,actor:user.name,role:user.role,date:new Date().toISOString(),status:'MENUNGGU_VERIFIKASI',title:payload.title,content:payload.content,attachments:payload.attachments||[]});d.case.case_status='RECONCILIATION';}
  if(action==='evidence')d.uploadedEvidences.unshift({evidenceId:`local-${Date.now()}`,type:payload.evidenceType,reference:payload.title,note:payload.note,availability:'YES',matchStatus:'PENDING'});
  demoEvent(d,action.toUpperCase(),payload);return {success:true,caseId:id,persisted:false};
}
export const submitReviewOutcome=(id,payload)=>mutate(id,'outcome',payload);
export const assignCaseReviewer=(id,payload)=>mutate(id,'assign',payload);
export const takeCaseOwnership=(id)=>mutate(id,'ownership');
export const sendClarificationRequestToClinician=(id,payload)=>mutate(id,'clarification',payload);
export const submitDisputeRebuttal=(id,payload)=>mutate(id,'dispute',payload);
export const uploadSupportingEvidence=(id,payload)=>mutate(id,'evidence',payload);
export const triggerAnalysis=()=>apiRequest('/analysis/run',{method:'POST'}).then(r=>r.data);
export const fetchValidationBenchmark=()=>apiRequest('/validation').then(r=>r.data);
