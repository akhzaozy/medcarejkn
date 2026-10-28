import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { catalog, tableDetail, readBpjsData } from '../src/services/bpjsService.js';
import express from 'express';
import bpjsRoutes from '../src/routes/bpjsRoutes.js';

const fixture = {edition:2025,extractedOn:'2026-10-28',notes:[],tables:[
  {id:'T01',cohort:'Reguler',kind:'kepesertaan',rows:4,sampleRows:2},
  {id:'T02',cohort:'Reguler',kind:'referensi_icd',rows:20,sampleRows:1}],
  variables:[{tableId:'T01',column:'PSTV05',codeSet:'sex'}],
  distributions:[{tableId:'T01',column:'PSTV05',rows:4}],monthly:[],
  samples:{T01:[{PSTV05:1},{PSTV05:2}]},codeSets:{sex:{1:'LAKI-LAKI',2:'PEREMPUAN'}}};

test('BPJS catalog excludes reference rows and keeps cohort scope',()=>{
  const c=catalog(fixture);
  assert.equal(c.totalRows,4);
  assert.equal(c.tableCount,1);
  assert.deepEqual(c.cohorts,['Reguler']);
  assert.equal(c.tables.length,2);
});

test('BPJS HTTP catalog, table and whitelisted downloads', async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'bpjs-http-'));
  const previous=process.env.BPJS_DATA_DIR;
  let server;
  try {
    process.env.BPJS_DATA_DIR=directory;
    fs.writeFileSync(path.join(directory,'analysis.json'),JSON.stringify(fixture));
    fs.writeFileSync(path.join(directory,'BPJS_2025_Analisis.xlsx'),'workbook fixture');
    const app=express();
    app.use('/api/bpjs',bpjsRoutes);
    server=await new Promise(resolve=>{ const s=app.listen(0,'127.0.0.1',()=>resolve(s)); });
    const base=`http://127.0.0.1:${server.address().port}/api/bpjs`;
    const c=await fetch(`${base}/catalog`);
    assert.equal(c.status,200);
    assert.equal((await c.json()).data.downloads.excel,true);
    const d=await fetch(`${base}/tables/T01`);
    assert.equal((await d.json()).data.samples.length,2);
    assert.equal((await fetch(`${base}/tables/unknown`)).status,404);
    assert.equal((await fetch(`${base}/download/analysis.json`)).status,404);
    assert.equal((await fetch(`${base}/download/full`)).status,404);
    const download=await fetch(`${base}/download/excel`);
    assert.match(download.headers.get('content-disposition'),/BPJS_2025_Analisis.xlsx/);
    assert.equal(await download.text(),'workbook fixture');
  } finally {
    if(server) { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
    if(previous===undefined) delete process.env.BPJS_DATA_DIR; else process.env.BPJS_DATA_DIR=previous;
    fs.rmSync(directory,{recursive:true,force:true});
  }
});
test('BPJS detail returns only selected source, code mapping and explicit preview scope',()=>{
  const d=tableDetail('T01',fixture);
  assert.equal(d.samples.length,2);
  assert.equal(d.codeSets.sex[2],'PEREMPUAN');
  assert.match(d.sampleNote,/bukan sampel acak/);
  assert.equal(tableDetail('../../etc/passwd',fixture),null);
});
test('BPJS missing extraction is unavailable, not fabricated data',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'bpjs-test-'));
  const previous=process.env.BPJS_DATA_DIR;
  try {
    process.env.BPJS_DATA_DIR=directory;
    assert.throws(()=>readBpjsData(),e=>e.statusCode===503);
    fs.writeFileSync(path.join(directory,'analysis.json'),JSON.stringify(fixture));
    assert.equal(readBpjsData().tables[0].rows,4);
  } finally {
    if(previous===undefined) delete process.env.BPJS_DATA_DIR; else process.env.BPJS_DATA_DIR=previous;
    fs.rmSync(directory,{recursive:true,force:true});
  }
});
