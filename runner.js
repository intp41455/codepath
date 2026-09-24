let runtime;
async function boot(){if(runtime)return runtime;postMessage({type:'status',message:'正在准备真实 Python 环境…\n首次需要下载，后续通常会更快。'});importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');runtime=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'});return runtime}
self.onmessage=async e=>{try{const py=await boot(),m=e.data;py.globals.set('_payload',JSON.stringify(m));if(m.kind==='sql')await py.loadPackage('sqlite3');postMessage({type:'executing'});const result=await py.runPythonAsync(`
import json, io, contextlib, traceback, ast
_m=json.loads(_payload)
_result={'output':'','passed':False,'feedback':''}
try:
    if _m['kind']=='sql':
        import sqlite3
        _db=sqlite3.connect(':memory:')
        try:
            _db.executescript(_m.get('setup',''))
            _pending=''
            _rows=[]
            _headers=[]
            for _char in _m['code']+'\\n;':
                _pending+=_char
                if _char==';' and sqlite3.complete_statement(_pending):
                    _cur=_db.execute(_pending)
                    if _cur.description:
                        _headers=[d[0] for d in _cur.description]
                        _rows=[list(r) for r in _cur.fetchmany(2001)]
                        if len(_rows)>2000: raise ValueError('结果超过 2000 行，请缩小查询范围')
                    _pending=''
            _result['output']=(' | '.join(_headers)+'\\n'+'\\n'.join(' | '.join(map(str,r)) for r in _rows))[:20000]
            if _m.get('verify'):
                _actual=[list(r) for r in _db.execute(_m['verify']).fetchall()]
            else:
                _actual=_rows
            _result['passed']=_actual==_m.get('expected')
            _result['feedback']='结果还不符合任务要求。检查筛选条件、列顺序、排序和边界值。'
        finally:
            _db.close()
    else:
        class _LimitedOutput(io.StringIO):
            def write(self, value):
                if self.tell()+len(value)>20000: raise ValueError('输出超过 20000 字符')
                return super().write(value)
        _capture=_LimitedOutput()
        _ns={'__name__':'__main__'}
        with contextlib.redirect_stdout(_capture):
            exec(compile(_m['code'],'main.py','exec'),_ns)
        _result['output']=_capture.getvalue()[:20000]
        _ns['_output']=_capture.getvalue().strip()
        try:
            _checks=[0]
            def _record_check(): _checks[0]+=1
            class _CountAssertions(ast.NodeTransformer):
                def visit_Assert(self,node):
                    return [ast.copy_location(ast.Expr(ast.Call(ast.Name('_record_check',ast.Load()),[],[])),node),node]
            _tree=ast.fix_missing_locations(_CountAssertions().visit(ast.parse(_m['test'])))
            _ns['_record_check']=_record_check
            with contextlib.redirect_stdout(_capture), contextlib.redirect_stderr(_capture):
                exec(compile(_tree,'checks.py','exec'),_ns)
            _result['passed']=_checks[0]>0
            _result['checks']=_checks[0]
            if not _result['passed']: _result['feedback']='没有执行任何断言，尚未验证正确性。'
        except Exception as _check:
            _result['feedback']=str(_check) or '检查未通过，请对照任务检查变量、返回值和输出。'
except Exception as _err:
    _result['error']=type(_err).__name__+': '+str(_err)
    if '_capture' in globals():
        _result['output']=_capture.getvalue()[:20000]
json.dumps(_result,ensure_ascii=False)
`);postMessage(JSON.parse(result))}catch(err){runtime=null;postMessage({output:'',passed:false,error:'运行环境暂不可用：'+String(err.message||err)})}};
