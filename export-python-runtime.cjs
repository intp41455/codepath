// Extract the exact Python program embedded in the delivered browser worker.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
let source='';const py={globals:{set(){}},loadPackage:async()=>{},runPythonAsync:async s=>{source=s;return '{}'}};
const c={importScripts(){},loadPyodide:async()=>py,postMessage(){}};c.self=c;vm.createContext(c);
vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../dist/runner.js'),'utf8'),c);
Promise.resolve(c.onmessage({data:{kind:'python',code:'',test:''}})).then(()=>process.stdout.write(source));
