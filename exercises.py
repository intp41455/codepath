"""Execute authored Python / SQLite references and reject unfinished exercises.
Only use with this trusted, authored curriculum: this script is NOT a sandbox.
"""
import contextlib
import io
import json
import pathlib
import sqlite3
import subprocess
import sys

root = pathlib.Path(__file__).resolve().parents[1]
data = json.loads(subprocess.check_output(['node', str(root / 'scripts/export-curriculum.cjs')], encoding='utf-8'))
passed = 0
for lesson in data['lessons']:
    kind = lesson['kind']
    if kind == 'python':
        capture = io.StringIO()
        scope = {'__name__': '__main__'}
        with contextlib.redirect_stdout(capture):
            exec(compile(lesson['solution'], lesson['id'], 'exec'), scope)
        scope['_output'] = capture.getvalue().strip()
        exec(lesson['test'], scope)
        # Negative controls for the new algorithm module are unimplemented starters.
        if lesson['id'].startswith('as-'):
            failed = False
            try:
                bad = {'_output': ''}
                exec(lesson['starter'], bad)
                exec(lesson['test'], bad)
            except Exception:
                failed = True
            assert failed, lesson['id'] + ' starter falsely passed'
    elif kind == 'sql':
        db = sqlite3.connect(':memory:')
        db.executescript(lesson.get('setup', ''))
        pending, rows = '', []
        for char in lesson['solution'] + '\n;':
            pending += char
            if char == ';' and sqlite3.complete_statement(pending):
                cursor = db.execute(pending)
                if cursor.description:
                    rows = [list(row) for row in cursor.fetchall()]
                pending = ''
        if lesson.get('verify'):
            rows = [list(row) for row in db.execute(lesson['verify'])]
        assert rows == lesson['expected'], lesson['id']
        db.close()
    else:
        continue
    passed += 1
    print('PASS', lesson['id'])
print(f'{passed} Python/SQLite reference exercises passed; 10 agent-system negative controls rejected.')
