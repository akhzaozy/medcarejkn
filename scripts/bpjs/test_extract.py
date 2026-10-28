import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
import zipfile
import pandas as pd

spec = importlib.util.spec_from_file_location('extract', Path(__file__).with_name('extract.py'))
extract = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract)

class ExtractionTests(unittest.TestCase):
    def test_full_rows_codes_dates_missing_and_duplicate_ids(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)/'source'
            folder = root/'Data Sampel Reguler Edisi 2025'/'data'
            folder.mkdir(parents=True)
            pd.DataFrame({'PSTV01':[11,11,22,None], 'PSTV02':[1,1,2,3], 'PSTV01_A':[51,51,52,None],
                          'PSTV05':[1,2,1,None], 'PSTV16':[2024]*4,
                          'PSTV03':pd.to_datetime(['2000-01-01','1899-12-30','2033-01-01',None])}).to_stata(
                folder/'test_kepesertaan.dta',write_index=False,version=118,
                convert_dates={'PSTV03':'td'},value_labels={'PSTV05':{1:'LAKI-LAKI',2:'PEREMPUAN'}})
            pd.DataFrame({'FKL02':['a','b','c'], 'FKL03':pd.to_datetime(['2024-01-01','2024-01-31',None]),
                          'FKL47':[100,0,None], 'FKL48':[90,0,None]}).to_stata(
                folder/'test_fkrtl.dta',write_index=False,version=118,convert_dates={'FKL03':'td'})
            out = Path(tmp)/'out'
            extract.run(root,out)
            data = json.loads((out/'analysis.json').read_text())
            members = next(t for t in data['tables'] if t['kind']=='kepesertaan')
            self.assertEqual(members['rows'],4)
            self.assertEqual(members['processedRows'],4)
            self.assertEqual(members['uniqueParticipants'],2)
            self.assertEqual(members['missingParticipantId'],1)
            self.assertEqual(members['quality']['birthAfterSampleYear'],1)
            self.assertEqual(members['quality']['birthBefore1900'],1)
            self.assertFalse(any(d['column']=='PSTV01_A' for d in data['distributions']))
            self.assertEqual(data['samples'][members['id']][0]['PSTV01_A'],'51')
            january = next(m for m in data['monthly'] if m['period']=='2024-01')
            self.assertEqual(january['rows'],2)
            self.assertEqual(january['billed'],100)
            self.assertEqual(january['billedCount'],2)
            self.assertIsNone(next(m for m in data['monthly'] if m['period']=='(kosong)')['billed'])
            self.assertEqual(sum(d['rows'] for d in data['distributions'] if d['column']=='PSTV05'),4)
            self.assertTrue(any(d['label']=='PEREMPUAN' for d in data['distributions']))
            with zipfile.ZipFile(out/'BPJS_2025_Detail_Lengkap.zip') as z:
                raw = pd.read_csv(io.BytesIO(z.read(members['csv'])), dtype={'PSTV01':'string'})
                self.assertEqual(len(raw),4)
                self.assertEqual(raw['PSTV01'].iloc[0],'11')
                self.assertEqual(raw['PSTV03'].iloc[0],'2000-01-01')

if __name__=='__main__':
    unittest.main()
