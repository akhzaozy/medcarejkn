const API=import.meta.env.VITE_API_BASE_URL || '/api';
export async function bpjsRequest(route,{signal,method='GET',body}={}) {
  const response=await fetch(`${API}/bpjs${route}`,{signal,method,
    ...(body ? {headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {})});
  const payload=await response.json();
  if(!response.ok) throw new Error(payload.message || payload.error || 'Data simulasi BPJS tidak dapat dimuat.');
  return payload.data;
}
