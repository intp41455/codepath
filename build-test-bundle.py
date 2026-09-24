"""Rebuild a reproducible downloadable source/test package without recursively including itself."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
root = Path(__file__).resolve().parents[1]
target = root/'dist/codepath-tests.zip'
with ZipFile(target, 'w', ZIP_DEFLATED) as archive:
    for directory in ('dist', 'tests', 'scripts'):
        for file in sorted((root/directory).rglob('*')):
            if file.is_file() and file.suffix not in ('.zip', '.pyc') and '__pycache__' not in file.parts:
                archive.write(file, file.relative_to(root))
    archive.write(root/'README.md', 'README.md')
with ZipFile(target) as archive:
    assert archive.testzip() is None
    for expected in ('dist/index.html', 'tests/regression.cjs', 'tests/runtime-python.py', 'scripts/export-python-runtime.cjs', 'dist/vendor/typescript/LICENSE.txt'):
        assert expected in archive.namelist(), expected
print(f'Validated test bundle: {target.name}, {target.stat().st_size} bytes')
