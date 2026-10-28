"""Build an indexed, read-only patient/encounter source for the competition demo."""
import argparse
import json
from pathlib import Path
import sqlite3
import pandas as pd

def value(v):
    if pd.isna(v) or v == '': return None
    return v.item() if hasattr(v,'item') else v

def identifier(v):
    v=value(v)
    return str(int(v)) if isinstance(v,(int,float)) else v

def build(source, output):
    meta=json.loads((output/'analysis.json').read_text())
    target=output/'bpjs-patients.sqlite'
    temporary=output/'bpjs-patients.partial.sqlite'
    if temporary.exists(): temporary.unlink()
    db=sqlite3.connect(temporary)
    db.executescript('''
      PRAGMA journal_mode=OFF;
      PRAGMA synchronous=OFF;
      PRAGMA cache_size=-65536;
      CREATE TABLE participants(cohort TEXT,patient_id TEXT,dob TEXT,sex INTEGER,status INTEGER,
        segment INTEGER,province INTEGER,county INTEGER,sample_year INTEGER,mother_id TEXT,source_table TEXT,
        PRIMARY KEY(cohort,patient_id)) WITHOUT ROWID;
      CREATE TABLE encounters(id INTEGER PRIMARY KEY,cohort TEXT,patient_id TEXT,kind TEXT,visit_id TEXT,
        started TEXT,ended TEXT,diagnosis_code TEXT,diagnosis_name TEXT,billed REAL,verified REAL,
        province INTEGER,county INTEGER,provider_type INTEGER,source_table TEXT,source_row INTEGER);
      CREATE TABLE secondary_diagnoses(cohort TEXT,visit_id TEXT,diagnosis_code TEXT,description TEXT);
      CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT);
    ''')
    manifest={'edition':meta['edition'],'cohorts':{},'tables':[]}
    for table in meta['tables']:
        kind=table['kind']
        if kind=='referensi_icd': continue
        columns=[v['column'] for v in meta['variables'] if v['tableId']==table['id']]
        if kind=='kepesertaan':
            wanted=['PSTV01','PSTV03','PSTV05','PSTV17','PSTV08','PSTV09_NEW','PSTV10','PSTV16','PSTV01_A']
        elif kind=='diagnosissekunder':
            wanted=['FKL02','FKL24','FKL24B']
        else:
            prefix={'fkrtl':'FKL','fktpkapitasi':'FKP','nonkapitasi':'PNK'}[kind]
            wanted=['PSTV01',prefix+'02',prefix+'03',prefix+('05' if kind=='nonkapitasi' else '04')]
            wanted+= {'fkrtl':['FKL18','FKL18A','FKL47','FKL48','FKL05_NEW','FKL06','FKL08'],
                      'fktpkapitasi':['FKP14A','FKP15A','FKP05_NEW','FKP06','FKP08'],
                      'nonkapitasi':['PNK14','PNK15','PNK17','PNK18','PNK06_NEW','PNK07','PNK09']}[kind]
        wanted=[c for c in wanted if c in columns]
        processed=0
        inserted=0
        with pd.io.stata.StataReader(source/table['source'],convert_categoricals=False,columns=wanted,chunksize=50000) as reader:
            for frame in reader:
                for c in frame:
                    if pd.api.types.is_datetime64_any_dtype(frame[c]):
                        frame[c]=frame[c].dt.strftime('%Y-%m-%d')
                rows=[]
                for offset,record in enumerate(frame.itertuples(index=False,name=None),start=processed+1):
                    r=dict(zip(wanted,record))
                    get=lambda c:value(r.get(c))
                    if kind=='kepesertaan':
                        pid=identifier(r.get('PSTV01'))
                        if pid is None: continue
                        rows.append((table['cohort'],pid,get('PSTV03'),get('PSTV05'),get('PSTV17'),get('PSTV08'),
                                     get('PSTV09_NEW'),get('PSTV10'),get('PSTV16'),identifier(r.get('PSTV01_A')),table['id']))
                    elif kind=='diagnosissekunder':
                        rows.append((table['cohort'],identifier(r.get('FKL02')),get('FKL24'),get('FKL24B')))
                    else:
                        spec={'fkrtl':('FKL18','FKL18A','FKL47','FKL48','FKL05_NEW','FKL06','FKL08'),
                              'fktpkapitasi':('FKP14A','FKP15A',None,None,'FKP05_NEW','FKP06','FKP08'),
                              'nonkapitasi':('PNK14','PNK15','PNK17','PNK18','PNK06_NEW','PNK07','PNK09')}[kind]
                        rows.append((table['cohort'],identifier(r.get('PSTV01')),kind,identifier(r.get(prefix+'02')),
                                     get(prefix+'03'),get(prefix+('05' if kind=='nonkapitasi' else '04')),
                                     *[get(c) for c in spec],table['id'],offset))
                if kind=='kepesertaan':
                    db.executemany('INSERT INTO participants VALUES (?,?,?,?,?,?,?,?,?,?,?)',rows)
                elif kind=='diagnosissekunder':
                    db.executemany('INSERT INTO secondary_diagnoses VALUES (?,?,?,?)',rows)
                else:
                    db.executemany('INSERT INTO encounters(cohort,patient_id,kind,visit_id,started,ended,diagnosis_code,diagnosis_name,billed,verified,province,county,provider_type,source_table,source_row) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',rows)
                db.commit()
                processed+=len(frame)
                inserted+=len(rows)
        assert processed==table['rows'],table['id']
        counts=manifest['cohorts'].setdefault(table['cohort'],{'participants':0,'encounters':0,'secondaryDiagnoses':0})
        counts[{'kepesertaan':'participants','diagnosissekunder':'secondaryDiagnoses'}.get(kind,'encounters')]+=inserted
        manifest['tables'].append({'id':table['id'],'sourceRows':processed,'indexedRows':inserted})
        print(f"{table['id']} {table['cohort']} {kind}: {inserted:,}",flush=True)
    print('Building lookup indexes…',flush=True)
    db.executescript('''
      CREATE INDEX encounter_patient ON encounters(cohort,patient_id,started DESC,id DESC);
      CREATE INDEX fkrtl_patient ON encounters(cohort,patient_id) WHERE kind='fkrtl';
      CREATE INDEX secondary_visit ON secondary_diagnoses(cohort,visit_id);
      ANALYZE;
    ''')
    db.execute('INSERT INTO metadata VALUES (?,?)',('manifest',json.dumps(manifest)))
    db.commit()
    assert db.execute('PRAGMA quick_check').fetchone()[0]=='ok'
    db.close()
    temporary.replace(target)
    (output/'patient-index.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
    print(f'Ready: {target}',flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--source',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    build(args.source,args.output)
