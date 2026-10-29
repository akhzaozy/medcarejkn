import configuration from '../config/evidence_requirements.json' with {type:'json'};
export function evidenceGapReport(detail,config=configuration){
  const recorded=(detail.evidenceLinks||[]).filter(e=>e.availability==='YES').map(e=>({evidenceId:e.evidenceId,type:e.type,reference:e.reference,claimItemId:e.claimItemId,verified:e.matchStatus==='MATCHED',source:{field:'evidenceLinks',evidenceId:e.evidenceId}}));
  const gaps=[];
  for(const item of detail.claimItems||[]){let rules=config.requirements.filter(r=>!r.serviceTypes.includes('DEFAULT')&&(r.serviceTypes.includes(item.serviceType)||r.codePrefixes.some(prefix=>String(item.serviceCode).startsWith(prefix))));if(!rules.length)rules=config.requirements.filter(r=>r.serviceTypes.includes('DEFAULT'));
    for(const rule of rules)for(const type of rule.types){const found=recorded.filter(e=>e.type===type&&e.claimItemId===item.claimItemId);if(!found.some(e=>e.verified))gaps.push({id:`${item.claimItemId}-${type}`,type,itemId:item.claimItemId,status:found.length?'pending_review':'missing',reason:found.length?'Referensi sudah dicatat, belum selesai dicocokkan.':'Referensi bukti belum tersedia untuk item ini.',question:`Mohon sampaikan atau konfirmasi ${type} untuk item ${item.serviceCode}.`,source:{ruleId:rule.id,ruleVersion:config.version,claimItemId:item.claimItemId,serviceCode:item.serviceCode,field:'claimItems/evidenceLinks'}});}
  }
  const unique=[...new Map(gaps.map(g=>[g.id,g])).values()];
  const draft=`Draf permintaan dokumen — wajib ditinjau petugas\nKasus: ${detail.case?.case_id||detail.caseId}\nMohon klarifikasi bukti pelayanan berikut:\n${unique.map(g=>`- ${g.question} [${g.source.ruleId}; item ${g.itemId}]`).join('\n')||'- Tidak ada kesenjangan pada persyaratan terkonfigurasi. Tetap periksa relevansi dokumen.'}\nCatatan: permintaan ini bukan penetapan fraud. Referensi tercatat belum berarti isi dokumen telah diverifikasi.`;
  return {version:config.version,scope:'structured_metadata_only',recorded,gaps:unique,questions:unique.map(g=>({text:g.question,source:g.source})),draft};
}
