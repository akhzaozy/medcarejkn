"""Extract BPJS Stata sources in chunks, preserving codes and source provenance.

Run with the bundled Python runtime. No source files are modified.
"""
import argparse
from collections import Counter
import hashlib
import io
from itertools import chain
import json
from pathlib import Path
import zipfile

import pandas as pd

GROUPS = {'Reguler': 'Reguler', 'COVID': 'COVID', ' DM ': 'DM',
          'Subset Anak': 'KIA Anak', 'Subset Ibu': 'KIA Ibu',
          'Mental': 'Kesehatan Mental', ' TB ': 'TB'}

def cohort(name):
    return next(value for key, value in GROUPS.items() if key in name)

def scalar(value):
    if pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.strftime('%Y-%m-%d')
    if hasattr(value, 'item'):
        value = value.item()
    return value

def key(value):
    value = scalar(value)
    if value is None or value == '':
        return '(kosong)'
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)

def run(root, output):
    output.mkdir(parents=True, exist_ok=True)
    tables, variables, code_sets, distributions, months, sample_rows = [], [], {}, [], [], {}
    archive_path = output / 'BPJS_2025_Detail_Lengkap.zip'
    partial_archive = output / '.BPJS_2025_Detail_Lengkap.partial.zip'
    with zipfile.ZipFile(partial_archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=1, allowZip64=True) as archive:
        for index, path in enumerate(sorted(root.rglob('*.dta'))):
            relative = path.relative_to(root)
            group = cohort(relative.parts[0])
            kind = path.stem.split('_')[-1] if relative.parts[1] == 'data' else 'referensi_icd'
            table_id = f'T{index + 1:02}'
            counts, missing, numeric, dates, monthly = {}, Counter(), {}, {}, {}
            participant_ids = set()
            quality = {'birthAfterSampleYear':0,'birthBefore1900':0} if kind == 'kepesertaan' else None
            processed = 0
            samples = []
            with pd.io.stata.StataReader(path, convert_categoricals=False, chunksize=100000) as reader:
                first = reader.read(nrows=1)
                columns = list(first.columns)
                expected = int(reader._nobs)
                labels = reader.variable_labels()
                labelmaps = {name: {str(k): str(v) for k, v in values.items()} for name, values in reader.value_labels().items()}
                bindings = dict(zip(columns, reader._lbllist))
                formats = dict(zip(columns, reader._fmtlist))
                identifier_columns = [c for c in columns if c.startswith(('PSTV01','PSTV02')) or c in ['FKP02','FKL02','PNK02']]
                for column in columns:
                    mapping = labelmaps.get(bindings[column], {})
                    set_id = ''
                    if mapping:
                        set_id = hashlib.sha256(json.dumps(mapping, sort_keys=True).encode()).hexdigest()[:12]
                        code_sets[set_id] = mapping
                    variables.append({'tableId': table_id, 'cohort': group, 'kind': kind, 'column': column,
                                      'label': labels.get(column, ''), 'format': formats[column], 'codeSet': set_id})
                if kind == 'kepesertaan':
                    category_columns = [c for c in columns if c not in identifier_columns + ['PSTV03','PSTV15']]
                elif kind == 'referensi_icd':
                    category_columns = []
                else:
                    category_columns = [c for c in columns if c in ['FKP05_NEW','FKP08','FKP10','FKP12','FKP14A','FKP22','FKL05_NEW','FKL08','FKL10','FKL12','FKL13','FKL14','FKL17A','FKL23','PNK06_NEW','PNK09','PNK11','PNK12','PNK13A','FKL24A']]
                counts = {c: Counter() for c in category_columns}
                cost_columns = [c for c in columns if c in ['FKL47','FKL48','PNK17','PNK18']]
                date_column = next((c for c in ['FKP03','FKL03','PNK03'] if c in columns), None)
                csv_name = str(relative.with_suffix('.csv'))
                with archive.open(csv_name, 'w', force_zip64=True) as binary:
                    text = io.TextIOWrapper(binary, encoding='utf-8-sig', newline='')
                    for chunk in chain([first], reader):
                        if len(samples) < 100:
                            for record in chunk.head(100-len(samples)).to_dict('records'):
                                samples.append({c: (key(v) if c in identifier_columns and not pd.isna(v) else scalar(v)) for c,v in record.items()})
                        if kind == 'kepesertaan':
                            participant_ids.update(chunk['PSTV01'].dropna().tolist())
                            quality['birthAfterSampleYear'] += int((chunk['PSTV03'].dt.year > chunk['PSTV16']).sum())
                            quality['birthBefore1900'] += int((chunk['PSTV03'] < pd.Timestamp('1900-01-01')).sum())
                        for c in columns:
                            series = chunk[c]
                            nulls = series.isna()
                            if series.dtype == object:
                                nulls = nulls | series.eq('')
                            missing[c] += int(nulls.sum())
                            if pd.api.types.is_datetime64_any_dtype(series):
                                clean = series.dropna()
                                if not clean.empty:
                                    lo, hi = scalar(clean.min()), scalar(clean.max())
                                    old = dates.get(c)
                                    dates[c] = [min(lo, old[0]) if old else lo, max(hi, old[1]) if old else hi]
                        for c in category_columns:
                            counts[c].update({key(k): int(v) for k,v in chunk[c].value_counts(dropna=False).items()})
                        for c in cost_columns:
                            clean = chunk[c].dropna()
                            bucket = numeric.setdefault(c, {'sum':0, 'count':0, 'min':None, 'max':None})
                            bucket['sum'] += float(clean.sum())
                            bucket['count'] += len(clean)
                            if len(clean):
                                bucket['min'] = min(bucket['min'], float(clean.min())) if bucket['min'] is not None else float(clean.min())
                                bucket['max'] = max(bucket['max'], float(clean.max())) if bucket['max'] is not None else float(clean.max())
                        if date_column:
                            period = chunk[date_column].dt.strftime('%Y-%m').fillna('(kosong)')
                            frame = pd.DataFrame({'period':period, 'rows':1})
                            for c in cost_columns:
                                frame[c] = chunk[c]
                                frame[c+'_count'] = chunk[c].notna().astype(int)
                            for period_key, row in frame.groupby('period').sum(min_count=1).iterrows():
                                bucket = monthly.setdefault(period_key, {'rows':0, **{c:0 for c in cost_columns}, **{c+'_count':0 for c in cost_columns}})
                                for c,v in row.items():
                                    if not pd.isna(v):
                                        bucket[c] += float(v)
                        # Numeric identifiers remain exact integers in the CSV; dates retain ISO order.
                        for c in identifier_columns:
                            if c in chunk and pd.api.types.is_numeric_dtype(chunk[c]):
                                chunk[c] = chunk[c].astype('Int64')
                        chunk.to_csv(text, index=False, header=processed == 0, date_format='%Y-%m-%d')
                        processed += len(chunk)
                    text.flush()
                    text.detach()
                if processed != expected:
                    raise ValueError(f'Row mismatch: {relative}: {processed} != {expected}')
                info = {'id':table_id, 'cohort':group, 'kind':kind, 'file':path.name, 'source':str(relative),
                        'rows':expected, 'processedRows':processed, 'columns':len(columns), 'bytes':path.stat().st_size,
                        'dates':dates, 'costs':numeric, 'sampleRows':len(samples), 'csv':csv_name,
                        'uniqueParticipants':len(participant_ids) if kind == 'kepesertaan' else None,
                        'missingParticipantId':missing.get('PSTV01',0) if 'PSTV01' in columns else None, 'quality':quality}
                tables.append(info)
                sample_rows[table_id] = samples
                for variable in variables:
                    if variable['tableId'] == table_id:
                        variable['missing'] = missing[variable['column']]
                for c, values in counts.items():
                    mapping = labelmaps.get(bindings[c], {})
                    for code, n in sorted(values.items()):
                        distributions.append({'tableId':table_id,'cohort':group,'kind':kind,'column':c,'dimension':labels.get(c,c),
                                              'code':code,'label':mapping.get(code,code),'rows':n})
                for period, values in sorted(monthly.items()):
                    billed_count = values.get('FKL47_count',values.get('PNK17_count'))
                    verified_count = values.get('FKL48_count',values.get('PNK18_count'))
                    months.append({'tableId':table_id,'cohort':group,'kind':kind,'period':period,
                                   'rows':int(values['rows']), 'billed':values.get('FKL47',values.get('PNK17')) if billed_count else None,
                                   'verified':values.get('FKL48',values.get('PNK18')) if verified_count else None,
                                   'billedCount':billed_count, 'verifiedCount':verified_count})
                print(f'{table_id} {group:18} {kind:20} {processed:>10,} baris', flush=True)
        for path in sorted(root.rglob('*.xlsx')):
            archive.write(path, str(path.relative_to(root)))
        result = {'edition':2025,'extractedOn':'2026-10-28','sampleLimitPerTable':100,
                  'tables':tables,'variables':variables,'codeSets':code_sets,'distributions':distributions,
                  'monthly':months,'samples':sample_rows,
                  'notes':[
                    'Ringkasan dihitung dari seluruh baris sumber. Contoh detail berisi 100 baris pertama per tabel dan bukan sampel acak.',
                    'Kelompok kontekstual dapat bertumpang tindih. Jumlah lintas kelompok bukan peserta nasional unik.',
                    'Hitungan dan biaya tidak dibobotkan. PSTV15 dipertahankan, tanpa estimasi populasi nasional.',
                    'Tahun 2025 adalah edisi rilis. Tahun sampel dan tanggal layanan mengikuti sumber.',
                    'Tidak ada tabel nonkapitasi untuk KIA Anak pada folder sumber.',
                    'Kode MISSING, TIDAK TERDEFINISI dan kode sentinel sumber dipertahankan. Kolom kosong hanya menghitung null atau string kosong.',
                    'Data sampel BPJS tidak memuat bukti pelayanan aktual atau label fraud terkonfirmasi. Analisis ini tidak menghasilkan putusan fraud.',
                    'Tanggal lahir setelah tahun sampel dan sebelum 1900 ditandai di Katalog. Nilai asli dipertahankan; tidak dikoreksi otomatis.'
                  ]}
        archive.writestr('metadata_dan_kamus.json', json.dumps(result, ensure_ascii=False))
    partial_analysis = output/'analysis.json.tmp'
    partial_analysis.write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
    partial_archive.replace(archive_path)
    partial_analysis.replace(output/'analysis.json')
    print(f'Selesai: {archive_path} ({archive_path.stat().st_size:,} bytes)', flush=True)

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--source',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    run(args.source.resolve(),args.output.resolve())
