self.onmessage=async ({data:m})=>{
  let output='';const log=(...values)=>{output+=(values.map(v=>typeof v==='string'?v:JSON.stringify(v)).join(' ')+'\n');if(output.length>20000)throw Error('输出超过 20,000 字符，请缩小数据量')};
  try{
    let code=m.code;
    if(m.kind==='typescript'){
      const files={...m.libs,'main.ts':code,'console.d.ts':'declare const console: { log(...values: unknown[]): void };'};
      const options={strict:true,noEmitOnError:true,target:ts.ScriptTarget.ES2015,module:ts.ModuleKind.None,lib:['lib.es5.d.ts','lib.es2015.promise.d.ts']};
      let emitted='';const host={getSourceFile:(name,lang)=>files[name]===undefined?undefined:ts.createSourceFile(name,files[name],lang),getDefaultLibFileName:()=> 'lib.es5.d.ts',writeFile:(name,text)=>{if(name==='main.js')emitted=text},getCurrentDirectory:()=>'',getDirectories:()=>[],fileExists:name=>files[name]!==undefined,readFile:name=>files[name],getCanonicalFileName:name=>name,useCaseSensitiveFileNames:()=>true,getNewLine:()=> '\n'};
      const program=ts.createProgram(['main.ts','console.d.ts'],options,host),diagnostics=ts.getPreEmitDiagnostics(program);
      if(diagnostics.length)throw Error(diagnostics.map(d=>{const p=d.file&&d.start!==undefined?d.file.getLineAndCharacterOfPosition(d.start):null;return (d.file?d.file.fileName+':'+(p?p.line+1:1)+' ':'')+ts.flattenDiagnosticMessageText(d.messageText,'\n')}).join('\n'));
      program.emit();code=emitted;
    }
    self.postMessage({type:'executing'});
    let assertions=0;
    const assert=(condition,message='断言不通过')=>{assertions++;if(!condition)throw Error(message)};
    const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
    const fn=new AsyncFunction('console','assert','_output',`"use strict";\n${code}\n${m.test||''}`);
    await fn({log,warn:log,error:log},assert,()=>output);
    self.postMessage({output,passed:assertions>0,checks:assertions,feedback:assertions?'':'代码已执行；没有执行任何断言，尚未验证业务正确性。'});
  }catch(e){self.postMessage({output,passed:false,error:String(e.message||e)})}
};
