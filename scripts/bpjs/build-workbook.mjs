import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const output = path.resolve(process.argv[2] || 'outputs/bpjs-2025');
const data = JSON.parse(await fs.readFile(path.join(output, 'analysis.json'), 'utf8'));
const wb = Workbook.create();
const palette = { navy:'#173D55', teal:'#007A78', ink:'#233B49', muted:'#657D89', light:'#EFF5F7', amber:'#FFF2CC' };
const names = ['Dashboard','Kepesertaan','Layanan','Bulanan','Biaya','Katalog','Kamus Variabel','Kamus Kode','Contoh Peserta','Contoh FKTP','Contoh FKRTL','Contoh Nonkapitasi','Contoh Diagnosis','Petunjuk'];
const sheets = Object.fromEntries(names.map(name => [name, wb.worksheets.add(name)]));
const col = n => { let s=''; for(n++;n;n=Math.floor((n-1)/26)) s=String.fromCharCode(65+(n-1)%26)+s; return s; };
const excelDate = s => s ? (s >= '1900-01-01' ? new Date(`${s}T00:00:00Z`) : s) : null;
let tableNumber=0;
function base(sheet, address) {
  sheet.showGridLines=false;
  sheet.getRange(address).format.font={name:'Arial',size:10,color:palette.ink};
  sheet.getRange(address).format.verticalAlignment='center';
  sheet.getRange(address).format.rowHeight=19;
}
function table(name, headers, rows, widths = [], start=5) {
  const sheet=sheets[name];
  const end=start+rows.length;
  const last=col(headers.length-1);
  base(sheet,`A1:${last}${Math.max(end,6)}`);
  sheet.getRange('A2').values=[[name]];
  sheet.getRange('A2').format.font={size:15,bold:true,color:palette.navy};
  sheet.getRange(`A${start}:${last}${start}`).values=[headers];
  if(rows.length) sheet.getRange(`A${start+1}:${last}${end}`).values=rows;
  const t=sheet.tables.add(`A${start}:${last}${end}`,true,`BPJSTable${++tableNumber}`);
  t.style='TableStyleMedium2';
  t.showFilterButton=true;
  sheet.getRange(`A${start}:${last}${start}`).format={fill:palette.navy,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',verticalAlignment:'center',rowHeight:32,wrapText:true};
  headers.forEach((_,i)=>sheet.getRange(`${col(i)}1:${col(i)}${end}`).format.columnWidth=widths[i] || 20);
  sheet.freezePanes.freezeRows(start);
  sheet.freezePanes.freezeColumns(Math.min(2,headers.length));
  return { sheet,end,start };
}

const sourceRows=data.tables.map(t=>[
  t.id,t.cohort,t.kind,t.file,t.rows,t.columns,t.processedRows,t.uniqueParticipants,t.missingParticipantId,
  excelDate(Object.values(t.dates).map(d=>d[0]).sort()[0]),excelDate(Object.values(t.dates).map(d=>d[1]).sort().at(-1)),t.bytes,t.source,t.csv
]);
const kat=table('Katalog',['ID tabel','Kelompok','Jenis tabel','File sumber','Baris sumber','Variabel','Baris diproses','Peserta unik PSTV01','ID peserta kosong','Tanggal minimum semua kolom','Tanggal maksimum semua kolom','Ukuran (byte)','Sumber relatif Downloads/2025','CSV dalam arsip'],sourceRows,[12,23,23,43,18,12,18,23,20,28,28,20,90,90]);
kat.sheet.getRange(`E6:I${kat.end}`).setNumberFormat('#,##0');
kat.sheet.getRange(`L6:L${kat.end}`).setNumberFormat('#,##0');
kat.sheet.getRange(`J6:K${kat.end}`).setNumberFormat('yyyy-mm-dd');
kat.sheet.getRange('A3').values=[['Tanggal minimum/maksimum mencakup seluruh kolom tanggal, termasuk tanggal lahir. Periode layanan ada di Bulanan.']];
kat.sheet.getRange('O5').values=[['Selisih ekstraksi']];
kat.sheet.getRange(`O6:O${kat.end}`).formulas=data.tables.map((_,i)=>[`=G${i+6}-E${i+6}`]);
kat.sheet.getRange(`O5:O${kat.end}`).format.columnWidth=20;
kat.sheet.getRange(`O6:O${kat.end}`).conditionalFormats.add('cellIs',{operator:'notEqual',formula:0,format:{fill:'#FDE9E7',font:{color:'#B42318',bold:true}}});
kat.sheet.getRange('P5:Q5').values=[['Lahir setelah tahun sampel','Lahir sebelum 1900']];
kat.sheet.getRange(`P6:Q${kat.end}`).values=data.tables.map(t=>[t.quality?.birthAfterSampleYear ?? null,t.quality?.birthBefore1900 ?? null]);
kat.sheet.getRange(`P5:Q${kat.end}`).format.columnWidth=30;
kat.sheet.getRange(`P6:Q${kat.end}`).conditionalFormats.add('cellIs',{operator:'greaterThan',formula:0,format:{fill:palette.amber,font:{color:'#805A12'}}});

const distributionRows = kind => data.distributions.filter(d => (d.kind==='kepesertaan')===kind).map(d=>[d.tableId,d.cohort,d.kind,d.column,d.dimension,d.code,d.label,d.rows]);
for(const [name,isMembership] of [['Kepesertaan',true],['Layanan',false]]) {
  const r=table(name,['ID tabel','Kelompok','Jenis tabel','Variabel','Dimensi','Kode sumber','Label sumber','Baris sampel'],distributionRows(isMembership),[12,23,23,20,65,20,75,20]);
  r.sheet.getRange('A3').values=[['Agregat seluruh baris. Setiap dimensi berdiri sendiri; jangan menjumlahkan dimensi berbeda. Filter Kelompok dan Variabel.']];
  r.sheet.getRange(`H6:H${r.end}`).setNumberFormat('#,##0');
}
const monthly=table('Bulanan',['ID tabel','Kelompok','Jenis tabel','Bulan layanan','Baris sampel','Tagih (Rp)','Verifikasi (Rp)','Baris tagih terisi','Baris verifikasi terisi'],data.monthly.map(m=>[m.tableId,m.cohort,m.kind,m.period,m.rows,m.billedCount?m.billed:null,m.verifiedCount?m.verified:null,m.billedCount,m.verifiedCount]),[12,23,23,20,20,25,25,23,25]);
monthly.sheet.getRange(`D6:D${monthly.end}`).values=data.monthly.map(m=>[/^\d{4}-\d{2}$/.test(m.period)?new Date(`${m.period}-01T00:00:00Z`):m.period]);
monthly.sheet.getRange(`D6:D${monthly.end}`).setNumberFormat('yyyy-mm');
monthly.sheet.getRange('A3').values=[['Tanggal datang FKTP/FKRTL atau tanggal kunjungan nonkapitasi. Biaya kosong berarti tidak ada kolom atau tidak ada nilai.']];
monthly.sheet.getRange(`E6:I${monthly.end}`).setNumberFormat('#,##0');

const costRows=[];
for(const t of data.tables) {
  for(const [c,stats] of Object.entries(t.costs)) {
    costRows.push([t.id,t.cohort,t.kind,c,data.variables.find(v=>v.tableId===t.id && v.column===c)?.label,stats.count,stats.count?stats.sum:null,stats.min,stats.max]);
  }
}
const cost=table('Biaya',['ID tabel','Kelompok','Jenis tabel','Variabel','Keterangan sumber','Nilai terisi','Total (Rp)','Minimum (Rp)','Maksimum (Rp)'],costRows,[12,23,23,15,76,20,28,24,24]);
cost.sheet.getRange(`F6:I${cost.end}`).setNumberFormat('#,##0');
cost.sheet.getRange('A3').values=[['Jumlah biaya sampel tanpa bobot. FKRTL dan nonkapitasi diringkas terpisah; selisih tagih dan verifikasi bukan bukti fraud.']];
const dict=table('Kamus Variabel',['ID tabel','Kelompok','Jenis tabel','Variabel','Keterangan sumber','Format Stata','Set kode','Kosong (null/string)'],data.variables.map(v=>[v.tableId,v.cohort,v.kind,v.column,v.label,v.format,v.codeSet,v.missing]),[12,23,23,25,85,20,20,26]);
dict.sheet.getRange('A3').values=[['Label asli Stata dipertahankan. Gunakan Set kode untuk mencocokkan kode dan label pada Kamus Kode.']];
dict.sheet.getRange(`H6:H${dict.end}`).setNumberFormat('#,##0');
dict.sheet.getRange(`H6:H${dict.end}`).conditionalFormats.add('cellIs',{operator:'greaterThan',formula:0,format:{fill:palette.amber,font:{color:'#805A12'}}});
const codes=table('Kamus Kode',['Set kode','Kode sumber','Label sumber'],Object.entries(data.codeSets).flatMap(([id,values])=>Object.entries(values).map(([code,label])=>[id,code,label])),[22,22,100]);
codes.sheet.getRange('A3').values=[['Set kode identik disimpan satu kali. Pemetaan setiap variabel tercantum pada Kamus Variabel.']];
codes.sheet.getRange(`C6:C${codes.end}`).format.wrapText=true;
codes.sheet.getRange(`C6:C${codes.end}`).format.autofitRows();

const detailNames={kepesertaan:'Contoh Peserta',fktpkapitasi:'Contoh FKTP',fkrtl:'Contoh FKRTL',nonkapitasi:'Contoh Nonkapitasi',diagnosissekunder:'Contoh Diagnosis'};
for(const [kind,name] of Object.entries(detailNames)) {
  const sources=data.tables.filter(t=>t.kind===kind);
  const columns=[...new Set(sources.flatMap(t=>data.variables.filter(v=>v.tableId===t.id).map(v=>v.column)))];
  const rows=sources.flatMap(t=>data.samples[t.id].map(s=>[t.id,t.cohort,...columns.map(c=>s[c] ?? null)]));
  const r=table(name,['ID tabel','Kelompok',...columns],rows,[12,23,...columns.map(c=>/A$|B$|FKP15|PNK16|FKL19/.test(c)?48:23)]);
  r.sheet.getRange('A3').values=[['100 baris pertama per tabel; bukan sampel acak. Seluruh detail tersedia di arsip CSV. Identitas peserta dan kunjungan disimpan sebagai teks.']];
  r.sheet.getRange(`A6:${col(columns.length+1)}${r.end}`).format.wrapText=true;
  columns.forEach((c,i)=>{
    const variable=data.variables.find(v=>v.column===c && v.kind===kind);
    const range=r.sheet.getRange(`${col(i+2)}6:${col(i+2)}${r.end}`);
    if(c.startsWith('PSTV01') || c.startsWith('PSTV02') || ['FKP02','FKL02','PNK02'].includes(c)) range.setNumberFormat('@');
    else if(variable?.format.startsWith('%td')) {
      range.values=rows.map(row=>[excelDate(row[i+2])]);
      range.setNumberFormat('yyyy-mm-dd');
    } else if(['PSTV15'].includes(c)) range.setNumberFormat('0.000000');
    else if(/FKL(32|34|37|40|43|46|47|48)$|PNK(17|18)$/.test(c)) range.setNumberFormat('#,##0');
  });
  r.sheet.getRange(`A6:${col(columns.length+1)}${r.end}`).format.autofitRows();
}

const dashboard=sheets.Dashboard;
base(dashboard,'A1:Q42');
dashboard.tabColor=palette.navy;
dashboard.getRange('A1:Q42').format.columnWidth=13;
dashboard.getRange('A2').values=[['Data Sampel BPJS Kesehatan']];
dashboard.getRange('A2').format.font={name:'Arial',size:16,bold:true,color:palette.navy};
dashboard.getRange('A3').values=[['Edisi 2025. Ringkasan seluruh baris sumber tanpa bobot.']];
dashboard.getRange('A3').format.font={italic:true,color:palette.muted};
dashboard.getRange('A5').values=[['Kelompok terpilih']];
dashboard.getRange('C5').values=[['Reguler']];
dashboard.getRange('C5').format.fill=palette.amber;
const cohorts=['Reguler','COVID','DM','KIA Anak','KIA Ibu','Kesehatan Mental','TB'];
dashboard.getRange('C5').dataValidation={rule:{type:'list',values:cohorts}};
dashboard.getRange('F5').values=[['Ubah sel kuning untuk menampilkan kelompok lain.']];
dashboard.getRange('A7:C7').values=[['Jenis tabel','Baris sampel','Peserta unik']];
dashboard.getRange('A7:C7').format={fill:palette.navy,font:{color:'#FFFFFF',bold:true},rowHeight:30};
const mainKinds=['kepesertaan','fktpkapitasi','fkrtl','nonkapitasi','diagnosissekunder'];
const kindLabels=['Kepesertaan','FKTP Kapitasi','FKRTL','Nonkapitasi','Diagnosis Sekunder'];
dashboard.getRange('A8:A12').values=kindLabels.map(v=>[v]);
dashboard.getRange('A7:A12').format.columnWidth=26;
dashboard.getRange('B7:C12').format.columnWidth=21;
for(let i=0;i<mainKinds.length;i++) {
  const r=i+8, type=mainKinds[i];
  const match=`Katalog!$B$6:$B$${kat.end},$C$5,Katalog!$C$6:$C$${kat.end},"${type}"`;
  dashboard.getRange(`B${r}`).formulas=[[`=IF(COUNTIFS(${match})=0,"Tidak tersedia",SUMIFS(Katalog!$E$6:$E$${kat.end},${match}))`]];
  if(i===0) dashboard.getRange(`C${r}`).formulas=[[`=SUMIFS(Katalog!$H$6:$H$${kat.end},${match})`]];
}
dashboard.getRange('B8:C12').setNumberFormat('#,##0');
dashboard.getRange('A14').values=[['Biaya FKRTL (Rp)']];
dashboard.getRange('A14').format.font={bold:true,color:palette.navy};
dashboard.getRange('A15:A17').values=[['Tagih'],['Verifikasi'],['Selisih tagih − verifikasi']];
for(const [r,c] of [[15,'FKL47'],[16,'FKL48']]) {
  const criteria=`Biaya!$B$6:$B$${cost.end},$C$5,Biaya!$D$6:$D$${cost.end},"${c}"`;
  dashboard.getRange(`B${r}`).formulas=[[`=IF(SUMIFS(Biaya!$F$6:$F$${cost.end},${criteria})=0,"Tidak tersedia",SUMIFS(Biaya!$G$6:$G$${cost.end},${criteria}))`]];
}
dashboard.getRange('B17').formulas=[['=IF(AND(ISNUMBER(B15),ISNUMBER(B16)),B15-B16,"Tidak tersedia")']];
dashboard.getRange('B15:B17').setNumberFormat('#,##0');
dashboard.getRange('A19').values=[['Hitungan lintas kelompok dapat memuat peserta yang sama.']];
dashboard.getRange('A20').values=[['Biaya dan selisih merupakan statistik sampel; tidak menyatakan fraud.']];
dashboard.getRange('A19:A20').format.font={italic:true,color:palette.muted};
dashboard.getRange('A23:C23').values=[['Kelompok','Baris kepesertaan','Baris FKRTL']];
dashboard.getRange('A23:C23').format={fill:palette.navy,font:{color:'#FFFFFF',bold:true},rowHeight:30};
dashboard.getRange('A24:A30').values=cohorts.map(v=>[v]);
for(let i=0;i<cohorts.length;i++) for(const [c,kind] of [['B','kepesertaan'],['C','fkrtl']]) dashboard.getRange(`${c}${i+24}`).formulas=[[`=SUMIFS(Katalog!$E$6:$E$${kat.end},Katalog!$B$6:$B$${kat.end},$A${i+24},Katalog!$C$6:$C$${kat.end},"${kind}")`]];
dashboard.getRange('B24:C30').setNumberFormat('#,##0');
const chart=dashboard.charts.add('bar',[dashboard.getRange('A23:A30'),dashboard.getRange('B23:B30')]);
chart.title='Baris kepesertaan per kelompok';
chart.hasLegend=false; chart.titleTextStyle.typeface='Arial'; chart.titleTextStyle.fontSize=13;
chart.xAxis={axisType:'textAxis',textStyle:{typeface:'Arial',fontSize:10}};
chart.yAxis={numberFormatCode:'#,##0',numberFormatSourceLinked:false,textStyle:{typeface:'Arial',fontSize:10}};
chart.series.items[0].fill=palette.teal;
chart.setPosition('F7','P22');
dashboard.getRange('F24').values=[['Cakupan ekstraksi']];
dashboard.getRange('F24').format.font={bold:true,color:palette.navy};
dashboard.getRange('F26').values=[['Tabel utama']];
dashboard.getRange('J26').values=[[data.tables.filter(t=>t.kind!=='referensi_icd').length]];
dashboard.getRange('F27').values=[['Baris tabel utama']];
dashboard.getRange('J27').formulas=[[`=SUMIFS(Katalog!$E$6:$E$${kat.end},Katalog!$C$6:$C$${kat.end},"<>referensi_icd")`]];
dashboard.getRange('J27').setNumberFormat('#,##0');
dashboard.getRange('F29').values=[['Contoh detail: 100 baris pertama per tabel.']];
dashboard.getRange('F30').values=[['Detail lengkap: arsip CSV, impor melalui Data > From Text/CSV.']];
dashboard.getRange('A33').values=[['Gunakan filter di setiap tabel. Bekukan header dan kolom identitas untuk menjelajah data.']];
dashboard.getRange('A35').values=[['Tahun 2025 adalah edisi rilis; tahun sampel dan periode layanan ada pada sumber.']];

const guide=table('Petunjuk',['Topik','Penjelasan'],[
  ...data.notes.map((n,i)=>[`Cakupan ${i+1}`,n]),
  ['Relasi peserta','PSTV01 menghubungkan kepesertaan ke layanan dalam kelompok yang sama. Validasi keunikan tabel kepesertaan sebelum join.'],
  ['Identitas ibu KIA Anak','PSTV01_A adalah nomor peserta ibu menurut label sumber. Kolom ini disimpan sebagai teks. Validasi kecocokan dan cakupan sebelum menghubungkan kelompok berbeda.'],
  ['Relasi diagnosis sekunder','FKL02 menghubungkan diagnosis sekunder ke FKRTL. Relasi satu-ke-banyak; agregasikan biaya sebelum join agar tidak berulang.'],
  ['Relasi rujukan','FKP02 tersedia sebagai ID FKTP dan nomor asal rujukan pada FKRTL. Nilai kosong atau tidak cocok harus diperiksa.'],
  ['Detail lengkap','BPJS_2025_Detail_Lengkap.zip memuat CSV seluruh 62 file Stata, 21 referensi Excel asli, dan metadata_dan_kamus.json.'],
  ['Impor ke Excel','Ekstrak arsip. Pilih Data > From Text/CSV. Tetapkan PSTV01, PSTV02, FKP02, FKL02 dan PNK02 sebagai Text. Untuk tabel besar pilih Only Create Connection dan Add to Data Model.'],
  ['Batas worksheet','Beberapa tabel melebihi 1.048.575 baris data ditambah header. Gunakan Power Query/Data Model atau pecah hasil impor. Workbook ini berisi agregat lengkap dan contoh detail yang ditandai.'],
  ['Filter dashboard','Sel C5 pada Dashboard adalah pilihan kelompok. Jumlah baris dan biaya dihitung ulang dari Katalog dan Biaya.'],
  ['Tanggal','Kolom tanggal di contoh detail bertipe tanggal Excel. CSV memakai YYYY-MM-DD. Tanggal asli tidak digeser ke edisi 2025.'],
  ['Tanggal sebelum 1900','Tanggal sebelum 1900 dipertahankan sebagai teks ISO karena berada di luar sistem tanggal standar Excel. Kolom P-Q pada Katalog menandai tanggal lahir yang perlu diperiksa.'],
  ['Pembacaan kode','Cocokkan variabel ke Set kode di Kamus Variabel, lalu cari set tersebut pada Kamus Kode. Nilai kode sumber tidak diganti.'],
  ['Pembaruan','Ekstrak ulang sumber dan bangun ulang workbook untuk memperbarui data. Ringkasan hasil ekstraksi adalah snapshot, bukan koneksi langsung ke folder sumber.'],
], [29,115]);
guide.sheet.getRange(`B6:B${guide.end}`).format.wrapText=true;
guide.sheet.getRange(`A6:B${guide.end}`).format.rowHeight=45;

// Verify changes in the interactive control, then restore the opening cohort.
wb.recalculate();
const expected = c => data.tables.find(t=>t.cohort===c && t.kind==='kepesertaan').rows;
if(dashboard.getRange('B8').values[0][0]!==expected('Reguler')) throw new Error('Dashboard Reguler mismatch');
dashboard.getRange('C5').values=[['TB']]; wb.recalculate();
if(dashboard.getRange('B8').values[0][0]!==expected('TB')) throw new Error('Dashboard selector did not recalculate');
dashboard.getRange('C5').values=[['KIA Anak']]; wb.recalculate();
if(dashboard.getRange('B11').values[0][0]!=='Tidak tersedia') throw new Error('Missing table shown as zero');
dashboard.getRange('C5').values=[['Reguler']]; wb.recalculate();
console.log((await wb.inspect({kind:'table',range:'Dashboard!A7:C17',tableMaxRows:12,tableMaxCols:3,maxChars:2200,include:'values,formulas'})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!',options:{useRegex:true,maxResults:20},maxChars:2000,summary:'Final formula error scan'})).ndjson);
await fs.mkdir(path.join(output,'previews'),{recursive:true});
for(const name of (process.argv.includes('--skip-previews') ? [] : names)) {
  const range=name==='Dashboard'?'A1:P36':name==='Petunjuk'?'A1:B10':name==='Kamus Kode'?'A1:C10': ['Kepesertaan','Layanan'].includes(name)?'A1:H10':name==='Kamus Variabel'?'A1:H10':name==='Katalog'?'A1:G10':name==='Biaya'?'A1:G10':name==='Bulanan'?'A1:G10':'A1:G10';
  const preview=await wb.render({sheetName:name,range,scale:1.4,format:'png'});
  await fs.writeFile(path.join(output,'previews',`${name}.png`),new Uint8Array(await preview.arrayBuffer()));
  console.log('Rendered',name);
}
const xlsx=await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(path.join(output,'BPJS_2025_Analisis.xlsx'));
console.log('Saved BPJS_2025_Analisis.xlsx');
