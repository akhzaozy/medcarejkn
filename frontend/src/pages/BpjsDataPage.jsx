import BpjsAnomalyExplorer from '../components/common/BpjsAnomalyExplorer';
import React, { useEffect, useState } from 'react';
import { Database, Download, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import '../styles/bpjs.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const number = value => value == null ? 'Tidak tersedia' : new Intl.NumberFormat('id-ID').format(value);
const kinds = { kepesertaan:'Kepesertaan', fktpkapitasi:'FKTP Kapitasi', fkrtl:'FKRTL', nonkapitasi:'Nonkapitasi', diagnosissekunder:'Diagnosis Sekunder', referensi_icd:'Referensi ICD-10' };
function MonthlyChart({ monthly }) {
  const periods=monthly.filter(m => /^\d{4}-\d{2}$/.test(m.period));
  if(!periods.length) return null;
  const max=Math.max(...periods.map(m=>m.rows),1);
  const monthIndex=p=>Number(p.slice(0,4))*12+Number(p.slice(5,7))-1;
  const firstMonth=monthIndex(periods[0].period);
  const step=760/(monthIndex(periods.at(-1).period)-firstMonth+1);
  return <figure className="bpjs-chart"><figcaption>Tren baris layanan, seluruh periode</figcaption><svg viewBox="0 0 800 180" role="img" aria-label={`Tren jumlah baris layanan ${periods[0].period} sampai ${periods.at(-1).period}`}><line x1="20" y1="145" x2="780" y2="145" stroke="#cddfdf"/>{periods.map(m=><rect key={m.period} x={20+(monthIndex(m.period)-firstMonth)*step} y={145-m.rows/max*120} width={Math.max(step-2,1)} height={m.rows/max*120} rx="2" fill="#007a78"><title>{m.period}: {number(m.rows)} baris</title></rect>)}<text x="20" y="168">{periods[0].period}</text><text x="780" y="168" textAnchor="end">{periods.at(-1).period}</text><text x="20" y="15">Maksimum {number(max)} baris</text></svg></figure>;
}
async function getData(url, signal) {
  const response = await fetch(`${API}/bpjs${url}`, { signal });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || body.error || 'Data BPJS tidak dapat dimuat.');
  return body.data;
}

export default function BpjsDataPage({onOpenPatients,currentUser,onSelectCase}) {
  const [catalog, setCatalog] = useState(null);
  const [cohort, setCohort] = useState('Reguler');
  const [kind, setKind] = useState('kepesertaan');
  const [referenceId, setReferenceId] = useState('');
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [tab, setTab] = useState('distributions');
  const [search, setSearch] = useState('');
  const [dimension, setDimension] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const controller = new AbortController();
    setError(''); setLoading(true);
    getData('/catalog', controller.signal).then(setCatalog).catch(e => { if (e.name !== 'AbortError') setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  const matchingTables = catalog?.tables.filter(t => t.cohort === cohort && t.kind === kind) || [];
  const selected = matchingTables.find(t => t.id === referenceId) || matchingTables[0];
  useEffect(() => {
    setDetail(null); setPage(1); setSearch(''); setDimension('');
    if (!selected) return;
    const controller = new AbortController();
    setLoading(true); setError('');
    getData(`/tables/${selected.id}`, controller.signal).then(setDetail).catch(e => { if (e.name !== 'AbortError') setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [selected?.id, retry]);
  useEffect(() => { setPage(1); }, [search, dimension, tab]);
  const mainTables = catalog?.tables.filter(t => t.cohort === cohort && t.kind !== 'referensi_icd') || [];
  const member = mainTables.find(t => t.kind === 'kepesertaan');
  const dimensions = [...new Map((detail?.distributions || []).map(d => [d.column, d.dimension])).entries()];
  const activeDimension = dimension || dimensions[0]?.[0] || '';
  const codeVariables = detail?.variables.filter(v => v.codeSet) || [];
  const codeVariable = codeVariables.find(v => v.column === dimension) || codeVariables[0];
  let rows = [], columns = [];
  if (detail) {
    if (tab === 'distributions') {
      columns = ['Kode', 'Kategori', 'Baris', 'Proporsi'];
      rows = detail.distributions.filter(d => d.column === activeDimension).sort((a,b) => b.rows-a.rows).map(d => [d.code,d.label,number(d.rows),`${(d.rows/detail.table.rows*100).toFixed(2)}%`]);
    } else if (tab === 'monthly') {
      columns = ['Bulan layanan', 'Baris', 'Biaya tagih (Rp)', 'Biaya verifikasi (Rp)'];
      rows = detail.monthly.map(m => [m.period,number(m.rows),number(m.billedCount ? m.billed : null),number(m.verifiedCount ? m.verified : null)]);
    } else if (tab === 'codes') {
      columns = ['Kode sumber', 'Label sumber'];
      rows = Object.entries(detail.codeSets[codeVariable?.codeSet] || {});
    } else if (tab === 'dictionary') {
      columns = ['Variabel', 'Keterangan sumber', 'Kosong', 'Kode tersedia'];
      rows = detail.variables.map(v => [v.column,v.label || 'Tanpa label sumber',number(v.missing),v.codeSet ? `${Object.keys(detail.codeSets[v.codeSet] || {}).length} kode` : '—']);
    } else {
      columns = detail.variables.map(v => v.column);
      rows = detail.samples.map(s => columns.map(c => s[c] == null ? '—' : String(s[c])));
    }
  }
  const filtered = rows.filter(row => row.some(value => String(value).toLowerCase().includes(search.toLowerCase())));
  const pages = Math.max(1, Math.ceil(filtered.length/15));
  const safePage = Math.min(page,pages);
  return <section className="bpjs-page">
    <div className="bpjs-heading"><div><div className="bpjs-eyebrow"><Database size={16}/> DATA SAMPEL BPJS KESEHATAN</div><h1>Eksplorasi data BPJS</h1><p>Edisi 2025. Telusuri kepesertaan, layanan, diagnosis, dan biaya dari data sumber.</p></div>
      <div className="bpjs-downloads">{catalog?.downloads.excel && <a href={`${API}/bpjs/download/excel`} className="btn-pill-primary"><Download size={16}/> Unduh Excel</a>}{catalog?.downloads.full && <a href={`${API}/bpjs/download/full`} className="btn-pill-outline"><Download size={16}/> Detail lengkap CSV</a>}</div></div>
    <div className="bpjs-notice">Sumber: folder data sampel BPJS yang diberikan. Kelompok dapat bertumpang tindih. Angka adalah hitungan sampel tanpa bobot; tahun layanan mengikuti data asli. Data ini belum mencakup bukti pelayanan untuk penetapan fraud.</div>
    {onOpenPatients && <div style={{marginBottom:22}}><button className="btn-pill-primary" onClick={()=>onOpenPatients(cohort)}>Pilih pasien & simulasi audit →</button></div>}
    {error && <div role="alert" className="bpjs-error">{error} <button onClick={() => setRetry(r => r+1)}><RefreshCw size={14}/> Coba lagi</button></div>}
    <div className="bpjs-controls"><label>Kelompok data<select value={cohort} onChange={e => setCohort(e.target.value)}>{(catalog?.cohorts || ['Reguler']).map(c => <option key={c}>{c}</option>)}</select></label><label>Jenis tabel<select value={kind} onChange={e => setKind(e.target.value)}>{Object.entries(kinds).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></label>{matchingTables.length>1 && <label>File referensi<select value={selected?.id} onChange={e => setReferenceId(e.target.value)}>{matchingTables.map(t => <option key={t.id} value={t.id}>{t.file}</option>)}</select></label>}<span>{catalog ? `${number(catalog.totalRows)} baris pada ${catalog.tableCount} tabel utama` : 'Memuat katalog…'}</span></div>
    <div className="bpjs-tabs" aria-label="Eksplorasi data dan pola"><button onClick={()=>setTab('distributions')} className={tab!=='anomalies'?'active':''}>Katalog & distribusi</button><button onClick={()=>setTab('anomalies')} className={tab==='anomalies'?'active':''}>Pola Anomali</button></div>
    {tab==='anomalies'&&<BpjsAnomalyExplorer cohort={cohort} currentUser={currentUser} onSelectCase={onSelectCase}/>}
    <div style={{display:tab==='anomalies'?'none':'contents'}}><div className="bpjs-kpis"><article><span>Baris kepesertaan</span><strong>{number(member?.rows)}</strong><small>{cohort}</small></article><article><span>Peserta unik dalam kelompok</span><strong>{number(member?.uniqueParticipants)}</strong><small>Berdasarkan PSTV01 pada tabel kepesertaan</small></article><article><span>Baris tabel terpilih</span><strong>{number(selected?.rows)}</strong><small>{kinds[kind]}</small></article></div>
    {(member?.quality?.birthAfterSampleYear>0 || member?.quality?.birthBefore1900>0) && <p className="bpjs-scope">Pemeriksaan tanggal lahir: {number(member.quality.birthAfterSampleYear)} baris memiliki tahun lahir setelah tahun sampel dan {number(member.quality.birthBefore1900)} baris bertanggal sebelum 1900. Periksa konteks tahun sampel sebelum menilai data; nilai sumber dipertahankan.</p>}
    <div className="bpjs-panel"><div className="bpjs-panel-title"><div><h2>{kinds[kind]} · {cohort}</h2><p>{selected?.file || 'Tabel tidak tersedia dalam sumber.'}</p></div>{selected && <span>{selected.columns} variabel</span>}</div>
      <div className="bpjs-tabs" role="tablist">{[['distributions','Distribusi'],['monthly','Tren bulanan'],['dictionary','Kamus variabel'],['codes','Kamus kode'],['samples','Contoh detail']].map(([k,v]) => <button key={k} role="tab" aria-selected={tab===k} className={tab===k?'active':''} onClick={() => { setTab(k); setDimension(''); }}>{v}</button>)}</div>
      {tab === 'samples' && detail && <p className="bpjs-scope">{detail.sampleNote} Gunakan unduhan CSV untuk seluruh detail; impor ID sebagai teks di Excel.</p>}
      {tab === 'monthly' && <p className="bpjs-scope">Biaya dijumlahkan tanpa bobot. “Tidak tersedia” berarti tabel tidak memiliki kolom biaya. Tanggal kosong dipisahkan.</p>}
      {tab === 'monthly' && detail && <MonthlyChart monthly={detail.monthly}/>}
      <div className="bpjs-table-tools">{tab==='distributions' && dimensions.length>0 && <label>Dimensi<select value={activeDimension} onChange={e => setDimension(e.target.value)}>{dimensions.map(([c,l]) => <option value={c} key={c}>{l} ({c})</option>)}</select></label>}{tab==='codes' && codeVariables.length>0 && <label>Variabel berkode<select value={codeVariable?.column} onChange={e => setDimension(e.target.value)}>{codeVariables.map(v => <option value={v.column} key={v.column}>{v.label} ({v.column})</option>)}</select></label>}<label className="bpjs-search"><Search size={16}/><input aria-label="Cari pada tampilan aktif" placeholder="Cari pada tampilan aktif…" value={search} onChange={e => setSearch(e.target.value)}/></label></div>
      {loading ? <p role="status" className="bpjs-empty">Memuat data BPJS…</p> : !catalog ? <p className="bpjs-empty">Katalog BPJS belum tersedia. Gunakan Coba lagi setelah proses ekstraksi selesai.</p> : !selected ? <p className="bpjs-empty">Tabel {kinds[kind]} tidak tersedia untuk {cohort} pada folder sumber.</p> : <><div className="bpjs-table-scroll"><table><thead><tr>{columns.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{filtered.slice((safePage-1)*15,safePage*15).map((r,i) => <tr key={i}>{r.map((v,j) => <td key={j}>{v}</td>)}</tr>)}</tbody></table>{filtered.length===0 && <p className="bpjs-empty">{tab==='monthly' ? 'Tidak ada kolom tanggal layanan untuk tabel ini.' : 'Tidak ada data yang sesuai.'}</p>}</div><div className="bpjs-pagination"><span>{number(filtered.length)} baris tampilan</span><button aria-label="Halaman sebelumnya" disabled={safePage===1} onClick={() => setPage(p => p-1)}><ChevronLeft size={16}/></button><span>{safePage} / {pages}</span><button aria-label="Halaman berikutnya" disabled={safePage===pages} onClick={() => setPage(p => p+1)}><ChevronRight size={16}/></button></div></>}
    </div>
    </div><details className="bpjs-method"><summary>Cakupan dan metode ekstraksi</summary>{catalog?.notes.map(n => <p key={n}>{n}</p>)}<p>Ekstraksi: {catalog?.extractedOn}. Kosong berarti null atau string kosong. Nilai kode MISSING pada sumber dipertahankan.</p></details>
  </section>;
}
