import argparse
import json
import sqlite3
from pathlib import Path
import pandas as pd

def verify(output,source):
    data=json.loads((output/'analysis.json').read_text())
    manifest=json.loads((output/'patient-index.json').read_text())
    db=sqlite3.connect(f'file:{output.resolve()}/bpjs-patients.sqlite?mode=ro',uri=True)
    db.row_factory=sqlite3.Row
    assert db.execute('PRAGMA quick_check').fetchone()[0]=='ok'
    for cohort,counts in manifest['cohorts'].items():
        for table,key in [('participants','participants'),('encounters','encounters'),('secondary_diagnoses','secondaryDiagnoses')]:
            actual=db.execute(f'SELECT COUNT(*) FROM {table} WHERE cohort=?',(cohort,)).fetchone()[0]
            assert actual==counts[key],(cohort,key,actual,counts[key])
        expected=sum(t['rows'] for t in data['tables'] if t['cohort']==cohort and t['kind']!='referensi_icd')
        assert sum(counts.values())==expected,(cohort,expected)
        print(cohort,counts,flush=True)
    for t in data['tables']:
        if t['kind'] not in ['fkrtl','fktpkapitasi','nonkapitasi']:continue
        with pd.io.stata.StataReader(source/t['source'],convert_categoricals=False) as reader:
            row=reader.read(nrows=1).iloc[0]
        indexed=db.execute('SELECT * FROM encounters WHERE source_table=? AND source_row=1',(t['id'],)).fetchone()
        assert indexed['patient_id']==str(int(row['PSTV01']))
        prefix={'fkrtl':'FKL','fktpkapitasi':'FKP','nonkapitasi':'PNK'}[t['kind']]
        assert indexed['visit_id']==str(row[prefix+'02'])
        assert indexed['started']==row[prefix+'03'].strftime('%Y-%m-%d')
        if t['kind']=='fkrtl':
            assert indexed['billed']==row['FKL47']
            assert indexed['diagnosis_code']==row['FKL18']
        elif t['kind']=='nonkapitasi':assert indexed['billed']==row['PNK17']
        else:assert indexed['billed'] is None
    cost=db.execute("SELECT SUM(billed),SUM(verified) FROM encounters WHERE cohort='Reguler' AND kind='fkrtl'").fetchone()
    expected=next(t['costs'] for t in data['tables'] if t['cohort']=='Reguler' and t['kind']=='fkrtl')
    assert cost[0]==expected['FKL47']['sum'] and cost[1]==expected['FKL48']['sum']
    print('Source IDs, dates, diagnosis, row counts, and regular FKRTL totals verified',flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);p.add_argument('--source',type=Path,required=True)
    args=p.parse_args();verify(args.output,args.source)
