import {MOCK_CASES,MOCK_USERS,getMockCaseDetails} from './mockData';
import {auditResponse,normalizeAuditResult,catalog} from '../../../shared/riskEngine.js';
import {publicUser} from '../../../shared/userIdentity.js';
export {getNotifications,addNotification,markNotificationsAsRead,fetchNotifications,markNotificationAsRead} from './notifications';
const API_BASE=import.meta.env.VITE_API_BASE_URL||'/api';
export function isDemoMode(){try{return localStorage.getItem('jkn_demo_mode')==='true';}catch{return false;}}
export function setDemoMode(value){if(value)localStorage.setItem('jkn_demo_mode','true');else localStorage.removeItem('jkn_demo_mode');}
export async function apiRequest(route,{method='GET',body,signal}={}) {
  let response;try{response=await fetch(API_BASE+route,{method,signal,headers:{...(body?{'Content-Type':'application/json'}:{}),...(localStorage.getItem('jkn_token')?{Authorization:`Bearer ${localStorage.getItem('jkn_token')}`}:{})},...(body?{body:JSON.stringify(body)}:{})});}catch(e){if(e.name==='AbortError')throw e;throw new Error('Layanan tidak dapat dihubungi. Perubahan belum disimpan.');}
  const data=await response.json().catch(()=>({}));if(!response.ok){if(response.status===401&&!route.startsWith('/auth/'))window.dispatchEvent(new Event('jkn_session_expired'));const error=new Error(data.message||'Permintaan belum berhasil. Silakan coba lagi.');error.status=response.status;throw error;}return data;
}
function filtered(filters={}){let cases=MOCK_CASES.filter(c=>(!filters.assignedTo||filters.assignedTo==='ALL'||(filters.assignedTo==='UNASSIGNED'?!c.assigned_to:c.assigned_to===filters.assignedTo))&&(!filters.riskMode||filters.riskMode==='ALL'||c.primary_risk_mode===filters.riskMode)&&(!filters.status||filters.status==='ALL'||(filters.status==='COMPLETED'?['CONFIRMED','NOT_CONFIRMED','CLOSED'].includes(c.case_status):c.case_status===filters.status))&&(!filters.reasonCode||filters.reasonCode==='ALL'||c.analysis?.signals?.some(s=>s.id===filters.reasonCode))&&(!filters.priority||filters.priority==='ALL'||c.review_priority===filters.priority)&&(!filters.search||JSON.stringify(c).toLowerCase().includes(filters.search.toLowerCase())));const limit=filters.limit==='ALL'?Math.max(1,cases.length):Math.max(1,Number(filters.limit)||12),page=Math.max(1,Number(filters.page)||1);return {data:cases.slice((page-1)*limit,page*limit),total:cases.length,totalPages:Math.max(1,Math.ceil(cases.length/limit)),page};}
export async function fetchDashboard(params={}){
  if(isDemoMode()){
    const cases=filtered({...params,limit:'ALL'}).data;
    const completed=cases.filter(c=>['CONFIRMED','NOT_CONFIRMED','CLOSED'].includes(c.case_status)).length;
    return {caseCount:cases.length,claimsAnalyzed:cases.length,highPriorityCases:cases.filter(c=>c.review_priority==='HIGH').length,completedReview:completed,pendingReview:cases.length-completed,reviewing:cases.filter(c=>c.case_status==='IN_REVIEW').length,unassigned:cases.filter(c=>!c.assigned_to).length,measuredCases:0,evidenceCoverage:null,financials:{totalBilled:cases.reduce((n,c)=>n+Number(c.total_amount||0),0)},topCases:cases.slice(0,4),monthly:[],schedules:[]};
  }
  return (await apiRequest('/dashboard?'+new URLSearchParams(params))).data;
}
export async function fetchCases(filters={}){return isDemoMode()?filtered(filters):apiRequest('/cases?'+new URLSearchParams(filters));}
export async function fetchCaseDetails(id){return isDemoMode()?getMockCaseDetails(id):(await apiRequest('/cases/'+encodeURIComponent(id))).data;}
export async function fetchCaseEvidence(id){if(isDemoMode()){const d=getMockCaseDetails(id);return {caseId:id,claimItems:d.claimItems,evidenceLinks:d.evidenceLinks};}return (await apiRequest(`/cases/${encodeURIComponent(id)}/evidence`)).data;}
export async function auditCheckClaim(input){
  if(isDemoMode())return normalizeAuditResult(auditResponse(input,{status:input.saveCase?'failed':'not_requested',caseId:null,message:input.saveCase?'Analisis selesai dalam mode demo. Kasus tidak disimpan ke server.':'Tidak disimpan (opsi simpan dimatikan).'}));
  try{return normalizeAuditResult(await apiRequest('/claims/audit-check',{method:'POST',body:input}));}catch(error){if(error.status&&error.status<500)throw error;return normalizeAuditResult(auditResponse(input,{status:input.saveCase?'failed':'not_requested',caseId:null,message:input.saveCase?'Analisis lokal berhasil, tetapi kasus belum tersimpan karena layanan tidak tersedia.':'Analisis lokal; opsi simpan dimatikan.'}));}
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
export async function uploadCaseFile(caseId,file,kind='evidence'){if(isDemoMode()){const sz=file.size<1048576?`${(file.size/1024).toFixed(1)} KB`:`${(file.size/1048576).toFixed(2)} MB`;return {fileId:`local-file-${Date.now()}`,name:file.name,fileName:file.name,mimeType:file.type||'application/pdf',fileSize:file.size,size:sz,downloadUrl:null,persisted:false};}let response;try{response=await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/files`,{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream','X-File-Name':encodeURIComponent(file.name),'X-File-Kind':kind,...(localStorage.getItem('jkn_token')?{Authorization:`Bearer ${localStorage.getItem('jkn_token')}`}:{})},body:file});}catch{throw new Error('Layanan tidak dapat dihubungi saat mengunggah file.');}const data=await response.json().catch(()=>({}));if(!response.ok){if(response.status===401)window.dispatchEvent(new Event('jkn_session_expired'));const error=new Error(data.message||'Gagal mengunggah file ke server.');error.status=response.status;throw error;}return data.data;}
export async function openCaseFile(caseId,fileMeta){if(!fileMeta?.fileId||String(fileMeta.fileId).startsWith('local-file-'))return false;const response=await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/files/${encodeURIComponent(fileMeta.fileId)}`,{headers:localStorage.getItem('jkn_token')?{Authorization:`Bearer ${localStorage.getItem('jkn_token')}`}:{}});if(!response.ok){const d=await response.json().catch(()=>({}));throw new Error(d.message||'Gagal membuka dokumen terlampir.');}const blob=await response.blob();const url=URL.createObjectURL(blob);const mime=(fileMeta.mimeType||blob.type||'').toLowerCase();if(mime.includes('pdf')||mime.startsWith('image/')){window.open(url,'_blank','noopener,noreferrer');}else{const a=document.createElement('a');a.href=url;a.download=fileMeta.fileName||fileMeta.name||'dokumen-bukti';document.body.appendChild(a);a.click();a.remove();}setTimeout(()=>URL.revokeObjectURL(url),60000);return true;}
export const triggerAnalysis=()=>apiRequest('/analysis/run',{method:'POST'}).then(r=>r.data);
export async function fetchValidationBenchmark(){
  if(!isDemoMode())return apiRequest('/validation').then(r=>r.data);
  const {default:benchmark}=await import('../../../data/benchmark/validation_report.json');
  return {...benchmark,rules:catalog,feedback:{label:'Dihitung dari keputusan reviewer di lingkungan demo. Bukan validasi eksternal.',reviewedCases:0,precisionAtK:null,bands:[],reportedSuggestions:0},limitations:['Mode demo browser tidak menyimpan keputusan ke server.','ML terlatih/hybrid belum tersedia.']};
}
