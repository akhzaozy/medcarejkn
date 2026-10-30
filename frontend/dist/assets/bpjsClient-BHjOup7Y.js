import{c as i}from"./index-pdhIHpK3.js";/**
 * @license lucide-react v1.44.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o={name:"chevron-left",size:24,node:[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]};o.node;const d=i(o),c="/api";async function m(n,{signal:r,method:s="GET",body:t}={}){const a=await fetch(`${c}/bpjs${n}`,{signal:r,method:s,headers:{...t?{"Content-Type":"application/json"}:{},...localStorage.getItem("jkn_token")?{Authorization:`Bearer ${localStorage.getItem("jkn_token")}`}:{}},...t?{body:JSON.stringify(t)}:{}}),e=await a.json();if(!a.ok)throw new Error(e.message||e.error||"Data simulasi BPJS tidak dapat dimuat.");return e.data}export{d as C,m as b};
