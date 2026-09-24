"""Checks the Python program actually shipped inside runner.js, not a parallel grader."""
import json
import pathlib
import subprocess

root = pathlib.Path(__file__).resolve().parents[1]
source = subprocess.check_output(['node', str(root/'scripts/export-python-runtime.cjs')], encoding='utf-8')
lessons = json.loads(subprocess.check_output(['node', str(root/'scripts/export-curriculum.cjs')], encoding='utf-8'))['lessons']
def run(payload):
    scope = {'_payload': json.dumps(payload)}
    exec(compile(source, 'browser-runner.py', 'exec'), scope)
    return scope['_result']

count = 0
for lesson in lessons:
    if lesson['kind'] not in ('python', 'sql'):
        continue
    result = run({**lesson, 'code': lesson['solution']})
    assert result['passed'], (lesson['id'], result)
    count += 1
for checks in ('', '# assert True', 'if False:\n    assert True', 'print("fine")'):
    result = run({'kind':'python', 'code':'value=1', 'test':checks})
    assert not result['passed'], result
    assert result['checks'] == 0
result = run({'kind':'python', 'code':'value=1', 'test':'assert value == 2, "wrong value"'})
assert not result['passed'] and 'wrong value' in result['feedback']
result = run({'kind':'python', 'code':'print("x"*20001)', 'test':'assert True'})
assert not result['passed'] and '20000' in result['error']
result = run({'kind':'sql', 'code':'WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<2001) SELECT x FROM n;', 'expected':[]})
assert not result['passed'] and '2000' in result['error']
print(f'{count} shipped-runtime reference checks + 7 negative/control cases passed.')
