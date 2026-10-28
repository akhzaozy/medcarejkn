import React,{useEffect,useRef,useState} from 'react';
import {Search,Users,FileSearch,ArrowRight,ChevronLeft,ChevronRight,RefreshCw,CheckCircle2,Clock,ClipboardList} from 'lucide-react';
import {bpjsRequest} from '../api/bpjsClient';
import ClaimAuditInputPage from './ClaimAuditInputPage';
import '../styles/bpjs-audit.css';

const num=v=>new Intl.NumberFormat('id-ID').format(v);
const money=v=>v==null?'Tidak tersedia':`Rp ${num(v)}`;
const kinds={fkrtl:'FKRTL',fktpkapitasi:'FKTP Kapitasi',nonkapitasi:'Nonkapitasi'};
const priorities={HIGH:'Tinggi',MEDIUM:'Sedang',LOW:'Rendah',NO_CONCLUSION:'Belum dapat disimpulkan'};
const statuses={OPEN:'Baru',REVIEWED:'Sudah ditelaah',NEEDS_MORE_EVIDENCE:'Perlu bukti tambahan',CLOSED:'Ditutup'};
const scenarios={SOURCE_ONLY:'Bukti belum tersedia',COMPLETE:'Bukti lengkap',PARTIAL:'Bukti sebagian',UNSUPPORTED:'Tidak ada bukti yang cocok'};
const stamp=s=>new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Makassar'}).format(new Date(s));

function AuditResult({audit,onReview,currentUser}) {
  const [notes,setNotes]=useState(audit.review_notes || '');
  const [status,setStatus]=useState('NEEDS_MORE_EVIDENCE');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const result=audit.result;
  async function save(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {onReview(await bpjsRequest(`/audits/${audit.id}`,{method:'PATCH',body:{status,notes,actor:currentUser?.username || 'Reviewer demo'}}));}
    catch(e){setError(e.message);} finally{setBusy(false);}
  }
  return <section className="ba-result" aria-label="Hasil audit BPJS">
    <div className="ba-section-head"><div><span className="ba-eyebrow">HASIL SIMULASI TERSIMPAN</span><h2>{result.summary}</h2></div><span className={`ba-priority ${result.reviewPriority.toLowerCase()}`}>{priorities[result.reviewPriority]}</span></div>
    <p>Peserta <strong>{audit.patient_id}</strong> · {audit.cohort} · {scenarios[audit.scenario]} · {statuses[audit.status]}</p>
    <div className="ba-result-metrics"><div><small>Cakupan bukti simulasi</small><strong>{result.availability==='UNAVAILABLE'?'Belum tersedia':`${result.coveragePct}%`}</strong></div><div><small>Biaya tagih sumber</small><strong>{money(audit.encounter.billed)}</strong></div><div><small>Biaya verifikasi sumber</small><strong>{money(audit.encounter.verified)}</strong></div></div>
    <div className="ba-evidence">{['Kehadiran / presensi','Catatan pelayanan'].map((label,i)=>{
      const state=result.availability==='UNAVAILABLE'?'Belum tersedia':i<result.supportedEvidence?'Sesuai skenario':'Belum cocok';
      return <div key={label}><span>{label}</span><strong>{state}</strong></div>;
    })}</div>
    <p className="ba-note">{result.evidenceBasis} Data BPJS asli tetap tersimpan. Selisih tagih dan verifikasi ditampilkan terpisah dari hasil pencocokan bukti.</p>
    <form onSubmit={save} className="ba-review"><h3>Telaah reviewer</h3><label>Status telaah<select value={status} onChange={e=>setStatus(e.target.value)}><option value="NEEDS_MORE_EVIDENCE">Perlu bukti tambahan</option><option value="REVIEWED">Sudah ditelaah</option><option value="CLOSED">Tutup simulasi</option></select></label><label>Catatan reviewer<textarea required maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Tuliskan hasil telaah skenario…"/></label><button disabled={busy} className="btn-pill-primary">{busy?'Menyimpan…':'Simpan telaah'}</button>{error && <p role="alert" className="ba-error">{error}</p>}</form>
    <details className="ba-trail"><summary>Jejak audit ({audit.events.length})</summary><p>ID kasus: {audit.id}</p>{audit.events.map((e,i)=><div key={i}><strong>{e.actor}</strong> · {e.action}<p>{e.notes}</p><small>{stamp(e.created_at)} WITA</small></div>)}</details>
  </section>;
}

export default function BpjsAuditPage({currentUser,onSelectCase,onOpenQueue,onBack,onTabChange,initialTab='patients',initialCohort='Reguler'}) {
  const [tab,setTab]=useState(initialTab);
  const [manual,setManual]=useState(false);
  const [cohort,setCohort]=useState(initialCohort);
  const [catalog,setCatalog]=useState(null);
  const [input,setInput]=useState(''); const [search,setSearch]=useState('');
  const [after,setAfter]=useState(''); const [previous,setPrevious]=useState([]);
  const [fkrtlOnly,setFkrtlOnly]=useState(true);
  const [roster,setRoster]=useState(null); const [loading,setLoading]=useState(false);
  const [selected,setSelected]=useState(null); const [history,setHistory]=useState(null); const [historyPage,setHistoryPage]=useState(1);
  const [encounterId,setEncounterId]=useState(null); const [detail,setDetail]=useState(null);
  const [scenario,setScenario]=useState('SOURCE_ONLY'); const [audit,setAudit]=useState(null);
  const [queue,setQueue]=useState(null); const [version,setVersion]=useState(0);
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const resultAnchor=useRef(null);
  useEffect(()=>{if(audit)resultAnchor.current?.scrollIntoView({behavior:'smooth',block:'start'});},[audit?.id]);
  useEffect(()=>{setTab(initialTab);},[initialTab]);
  useEffect(()=>{const timer=setTimeout(()=>{setSearch(input.trim());setAfter('');setPrevious([]);},300);return()=>clearTimeout(timer);},[input]);
  useEffect(()=>{
    const c=new AbortController();
    bpjsRequest('/patient-catalog',{signal:c.signal}).then(setCatalog).catch(e=>{if(e.name!=='AbortError')setError(e.message);});
    return()=>c.abort();
  },[version]);
  useEffect(()=>{
    const c=new AbortController();setLoading(true);setError('');setRoster(null);
    const query=new URLSearchParams({cohort,search,after,fkrtlOnly:String(fkrtlOnly)});
    bpjsRequest(`/patients?${query}`,{signal:c.signal}).then(setRoster).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});
    return()=>c.abort();
  },[cohort,search,after,fkrtlOnly,version]);
  useEffect(()=>{
    setHistory(null); if(!selected)return;
    const c=new AbortController();
    bpjsRequest(`/patients/${encodeURIComponent(selected.cohort)}/${selected.patient_id}?page=${historyPage}`,{signal:c.signal}).then(setHistory).catch(e=>{if(e.name!=='AbortError')setError(e.message);});
    return()=>c.abort();
  },[selected,historyPage]);
  useEffect(()=>{
    setDetail(null);setAudit(null); if(!encounterId)return;
    const c=new AbortController();
    bpjsRequest(`/encounters/${encounterId}`,{signal:c.signal}).then(setDetail).catch(e=>{if(e.name!=='AbortError')setError(e.message);});
    return()=>c.abort();
  },[encounterId]);
  useEffect(()=>{
    if(tab!=='queue')return;
    const c=new AbortController();
    bpjsRequest('/audits',{signal:c.signal}).then(setQueue).catch(e=>{if(e.name!=='AbortError')setError(e.message);});
    return()=>c.abort();
  },[tab,version]);
  function resetPatient(){setSelected(null);setHistory(null);setEncounterId(null);setDetail(null);setAudit(null);setScenario('SOURCE_ONLY');}
  function changeCohort(v){setCohort(v);setInput('');setSearch('');setAfter('');setPrevious([]);resetPatient();}
  async function runAudit(){
    if(!detail)return; setBusy(true);setError('');
    try{setAudit(await bpjsRequest('/audits',{method:'POST',body:{encounterId:detail.encounter.id,scenario,actor:currentUser?.username || 'Peserta demo'}}));setVersion(v=>v+1);}
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  async function openAudit(id){setError('');try{setAudit(await bpjsRequest(`/audits/${id}`));}catch(e){setError(e.message);}}
  if(manual)return <ClaimAuditInputPage currentUser={currentUser} onSelectCase={onSelectCase} onOpenQueue={onOpenQueue} onBack={()=>setManual(false)}/>;
  const p=history?.patient;
  const e=detail?.encounter;
  return <div className="ba-page">
    <div className="ba-heading"><div><span className="ba-eyebrow"><Users size={15}/> SIMULASI LOMBA DENGAN DATA BPJS</span><h1>Pasien & audit terintegrasi</h1><p>Pilih peserta, telusuri layanan, lalu jalankan skenario bukti tanpa mengetik ulang klaim.</p></div><button className="btn-pill-outline" onClick={()=>setManual(true)}>Input manual</button></div>
    <div className="ba-tabs"><button className={tab==='patients'?'active':''} onClick={()=>{setTab('patients');onTabChange?.('patients');setAudit(null);}}><Users size={16}/> Pasien BPJS</button><button className={tab==='queue'?'active':''} onClick={()=>{setTab('queue');onTabChange?.('queue');setAudit(null);}}><ClipboardList size={16}/> Antrean audit BPJS</button><button onClick={()=>setVersion(v=>v+1)} aria-label="Muat ulang pasien BPJS"><RefreshCw size={16}/></button></div>
    {error && <div role="alert" className="ba-error">{error}<button onClick={()=>setVersion(v=>v+1)}>Coba lagi</button></div>}
    {tab==='patients' && <>
      <div className="ba-controls"><label>Kelompok data<select value={cohort} onChange={e=>changeCohort(e.target.value)}>{Object.keys(catalog?.cohorts || {Reguler:{}}).map(c=><option key={c}>{c}</option>)}</select></label><label>Cari ID peserta<input inputMode="numeric" value={input} onChange={e=>setInput(e.target.value)} placeholder="Ketik awal ID peserta…"/></label><label className="ba-check"><input type="checkbox" checked={fkrtlOnly} onChange={e=>{setFkrtlOnly(e.target.checked);setAfter('');setPrevious([]);}}/> Peserta dengan layanan FKRTL</label><span>{catalog && `${num(catalog.cohorts[cohort]?.participants || 0)} peserta dalam kelompok`}</span></div>
      <div className="ba-workspace"><aside className="ba-roster"><div className="ba-section-head"><h2>Daftar peserta</h2><small>{loading?'Memuat…':`${roster?.items.length || 0} ditampilkan`}</small></div>
        {roster?.items.map(row=><button key={row.patient_id} className={`ba-patient ${selected?.patient_id===row.patient_id?'selected':''}`} onClick={()=>{setSelected(row);setHistoryPage(1);setEncounterId(null);setAudit(null);}}><span>Peserta {row.patient_id}</span><small>{row.sexLabel || 'Jenis kelamin tidak tersedia'} · {row.segmentLabel || 'Segmen tidak tersedia'}</small><small>{row.provinceLabel || 'Wilayah tidak tersedia'}</small><ArrowRight size={16}/></button>)}
        {!loading && roster?.items.length===0 && <p className="ba-empty">Tidak ada peserta yang cocok.</p>}
        <div className="ba-pagination"><button aria-label="Peserta sebelumnya" disabled={!previous.length || loading} onClick={()=>{setAfter(previous.at(-1));setPrevious(previous.slice(0,-1));}}><ChevronLeft size={16}/></button><span>Halaman {previous.length+1}</span><button aria-label="Peserta berikutnya" disabled={!roster?.nextCursor || loading} onClick={()=>{setPrevious([...previous,after]);setAfter(roster.nextCursor);}}><ChevronRight size={16}/></button></div>
      </aside><main className="ba-history">
        {!selected ? <div className="ba-empty ba-welcome"><FileSearch size={38}/><h2>Mulai dari pasien</h2><p>Pilih peserta di sebelah kiri untuk membuka profil dan riwayat layanan dari data BPJS.</p></div> : !history ? <p role="status" className="ba-empty">Memuat riwayat peserta…</p> : <>
          <div className="ba-profile"><div><span className="ba-eyebrow">PESERTA {p.cohort}</span><h2>Peserta {p.patient_id}</h2></div><span className="ba-status">Status sumber: {p.statusLabel || 'Tidak tersedia'}</span><dl><div><dt>Tanggal lahir</dt><dd>{p.dob || 'Tidak tersedia'}</dd></div><div><dt>Jenis kelamin</dt><dd>{p.sexLabel || 'Tidak tersedia'}</dd></div><div><dt>Segmen</dt><dd>{p.segmentLabel || 'Tidak tersedia'}</dd></div><div><dt>Tahun sampel</dt><dd>{p.sample_year || 'Tidak tersedia'}</dd></div></dl>{p.mother_id && <p>ID peserta ibu: {p.mother_id}</p>}</div>
          <div className="ba-section-head"><h2>Riwayat layanan ({num(history.total)})</h2><small>Urutan tanggal layanan terbaru</small></div>
          {history.encounters.length===0 && <p className="ba-empty">Tidak ada layanan untuk peserta ini pada kelompok sumber.</p>}
          <div className="ba-encounters">{history.encounters.map(row=><button key={row.id} className={encounterId===row.id?'selected':''} onClick={()=>{setEncounterId(row.id);setScenario('SOURCE_ONLY');}}><div><span className="ba-kind">{kinds[row.kind]}</span><small>{row.started || 'Tanggal tidak tersedia'}</small></div><strong>{row.diagnosis_code || 'Kode belum tersedia'} · {row.diagnosis_name || 'Nama diagnosis tidak tersedia'}</strong><span>{row.providerTypeLabel || 'Jenis faskes tidak tersedia'} · {row.provinceLabel || 'Wilayah tidak tersedia'}</span><div><small>ID kunjungan: {row.visit_id || 'Tidak tersedia'}</small><b>{money(row.billed)}</b></div></button>)}</div>
          {history.totalPages>1 && <div className="ba-pagination"><button disabled={historyPage===1} onClick={()=>setHistoryPage(v=>v-1)}>Sebelumnya</button><span>{historyPage} / {history.totalPages}</span><button disabled={historyPage===history.totalPages} onClick={()=>setHistoryPage(v=>v+1)}>Berikutnya</button></div>}
          {encounterId && !detail && <p role="status">Memuat detail layanan…</p>}
          {detail && <section className="ba-scenario"><h2>Siapkan audit layanan</h2><p>{kinds[e.kind]} · {e.started} · {e.diagnosis_code}</p><div className="ba-source-cost"><span>Tagih: <strong>{money(e.billed)}</strong></span><span>Verifikasi: <strong>{money(e.verified)}</strong></span><span>Selisih: <strong>{money(e.billingDifference)}</strong></span></div>
            {detail.secondaryDiagnoses.length>0 && <details><summary>Diagnosis sekunder ({detail.secondaryDiagnoses.length}{detail.secondaryTruncated?'+':''})</summary>{detail.secondaryDiagnoses.map((d,i)=><p key={i}>{d.diagnosis_code} · {d.description || 'Tanpa deskripsi'}</p>)}</details>}
            <label>Skenario bukti simulasi<select value={scenario} onChange={e=>{setScenario(e.target.value);setAudit(null);}}>{Object.entries(scenarios).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><p className="ba-note">Presensi dan catatan pelayanan ditambahkan sebagai skenario demo. Identitas, tanggal, diagnosis, dan biaya tetap mengikuti sumber BPJS.</p><button disabled={busy} className="btn-pill-primary" onClick={runAudit}><FileSearch size={17}/>{busy?'Mengevaluasi…':'Jalankan & simpan audit'}</button><small className="ba-provenance">Sumber: {e.sourceFile}, baris {num(e.source_row)}. Nomor kunjungan: {e.visit_id}.</small>
          </section>}
        </>}
      </main></div>
    </>}
    {tab==='queue' && <section className="ba-queue"><div className="ba-section-head"><div><h2>Antrean audit dari pasien BPJS</h2><p>{queue ? `${num(queue.total)} kasus simulasi tersimpan`:'Memuat antrean…'} · 100 kasus terbaru</p></div></div><div className="ba-table-scroll"><table><thead><tr><th>Peserta</th><th>Kelompok</th><th>Skenario</th><th>Prioritas</th><th>Status</th><th>Waktu</th><th/></tr></thead><tbody>{queue?.items.map(c=><tr key={c.id}><td>{c.patient_id}</td><td>{c.cohort}</td><td>{scenarios[c.scenario]}</td><td>{priorities[c.priority]}</td><td>{statuses[c.status]}</td><td>{stamp(c.created_at)}</td><td><button className="btn-pill-outline" onClick={()=>openAudit(c.id)}>Buka telaah</button></td></tr>)}</tbody></table></div>{queue?.items.length===0 && <p className="ba-empty">Belum ada kasus. Pilih pasien dan jalankan skenario untuk membuat antrean pertama.</p>}</section>}
    {audit && <div ref={resultAnchor} style={{scrollMarginTop:100}}><AuditResult key={audit.id} audit={audit} currentUser={currentUser} onReview={a=>{setAudit(a);setVersion(v=>v+1);}}/></div>}
  </div>;
}
