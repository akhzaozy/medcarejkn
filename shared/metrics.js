const ratio=(a,b)=>b?a/b:null;
export function thresholdMetrics(rows,threshold=60,capacity=20) {
  const ranked=[...rows].sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  let tp=0,fp=0,tn=0,fn=0;for(const r of rows){const positive=r.score>=threshold;if(positive&&r.label)tp++;else if(positive)fp++;else if(r.label)fn++;else tn++;}
  const precision=ratio(tp,tp+fp),recall=ratio(tp,tp+fn),k=Math.min(Math.max(1,Math.floor(capacity)),rows.length),top=ranked.slice(0,k),positive=rows.filter(r=>r.label===1).length;
  return {tp,fp,tn,fn,threshold,flagged:tp+fp,precision,recall,f1:precision!=null&&recall!=null&&precision+recall?2*precision*recall/(precision+recall):0,capacity:k,precisionAtK:ratio(top.filter(r=>r.label).length,k),recallAtK:ratio(top.filter(r=>r.label).length,positive),falseNegatives:fn,positiveRate:ratio(positive,rows.length)};
}
export function curveMetrics(rows){const positives=rows.filter(r=>r.label).length,negatives=rows.length-positives;if(!positives||!negatives)return {prAuc:null,rocAuc:null,curve:[]};let tp=0,fp=0,prevRecall=0,prevPrecision=1,prevFpr=0,rocAuc=0,prAuc=0;const curve=[{threshold:101,precision:1,recall:0,fpr:0}];for(const score of [...new Set(rows.map(r=>r.score))].sort((a,b)=>b-a)){for(const r of rows.filter(r=>r.score===score))r.label?tp++:fp++;const recall=tp/positives,precision=tp/(tp+fp),fpr=fp/negatives;prAuc+=(recall-prevRecall)*(precision+prevPrecision)/2;rocAuc+=(fpr-prevFpr)*(recall+prevRecall)/2;curve.push({threshold:score,precision,recall,fpr});prevRecall=recall;prevPrecision=precision;prevFpr=fpr;}return {prAuc,rocAuc,curve};}
export function seededRandom(seed){let x=seed>>>0;return()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296;};}
