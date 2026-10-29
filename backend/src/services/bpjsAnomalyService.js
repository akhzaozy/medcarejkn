import {readBpjsData} from './bpjsService.js';
const median=a=>{const s=[...a].sort((a,b)=>a-b);return s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2;};
const month=s=>{const [y,m]=s.split('-').map(Number);return y*12+m;};
export function analyzeMonthlyPatterns(rows){
  const anomalies=[],series=[];let skipped=0;
  const groups=new Map();for(const row of rows){if(!/^\d{4}-\d{2}$/.test(row.period)){skipped++;continue;}if(!groups.has(row.tableId))groups.set(row.tableId,[]);groups.get(row.tableId).push(row);}
  for(const [tableId,group]of groups){group.sort((a,b)=>a.period.localeCompare(b.period));series.push(...group);
    for(let i=3;i<group.length;i++){
      const current=group[i],past=group.slice(i-3,i);
      if(past.some((r,j)=>month(current.period)-month(r.period)!==3-j)){skipped++;continue;}
      for(const [metric,label,value]of [['rows','Volume layanan',r=>r.rows],['billed','Nilai tagih',r=>r.billedCount?r.billed:null],['meanBilled','Rata-rata tagih per baris berbiaya',r=>r.billedCount?r.billed/r.billedCount:null]]){
        const actual=value(current),values=past.map(value);if(actual==null||!Number.isFinite(actual)||values.some(v=>v==null||!Number.isFinite(v))){skipped++;continue;}
        const baseline=median(values),mad=median(values.map(v=>Math.abs(v-baseline))),scale=Math.max(1.4826*mad,Math.abs(baseline)*.1,1),score=(actual-baseline)/scale,ratio=baseline>0?actual/baseline:null;
        if(score>3&&ratio>1.5)anomalies.push({id:`${tableId}:${current.period}:${metric}`,tableId,cohort:current.cohort,kind:current.kind,period:current.period,metric,label,actual,baseline,ratio,robustScore:score,comparisonPeriods:past.map(r=>r.period),method:'Median 3 bulan sebelumnya; robust scale max(1.4826×MAD, 10% median, 1); kenaikan >50% dan skor >3',reason:'Menyimpang dari pola tiga bulan sebelumnya pada kelompok sumber yang sama.'});
      }
    }
  }
  return {anomalies:anomalies.sort((a,b)=>b.robustScore-a.robustScore||a.id.localeCompare(b.id)),series,skipped,scope:'Agregat tabel/cohort/bulan. Bukan bukti fraud dan bukan penilaian faskes individual.'};
}
export function bpjsPatterns({cohort='Reguler',kind='fkrtl'}={}){const data=readBpjsData();if(!data.tables.some(t=>t.cohort===cohort&&t.kind===kind)){const e=new Error('Kelompok atau jenis layanan tidak tersedia.');e.statusCode=404;throw e;}return {...analyzeMonthlyPatterns(data.monthly.filter(r=>r.cohort===cohort&&r.kind===kind)),cohort,kind,edition:data.edition};}

