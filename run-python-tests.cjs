const {spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');

const candidates=[];
if(process.env.CODEPATH_PYTHON)candidates.push([process.env.CODEPATH_PYTHON,[]]);
candidates.push(['python3',[]],['python',[]],['py',['-3']]);
if(process.platform==='win32'){
 const home=os.homedir(),local=process.env.LOCALAPPDATA||path.join(home,'AppData','Local');
 candidates.unshift(
  [path.join(home,'.cache','codex-runtimes','codex-primary-runtime','dependencies','python','python.exe'),[]],
  [path.join(local,'Programs','Python','Python310','python.exe'),[]]
 );
}
let chosen=null;
for(const [exe,prefix] of candidates){
 if((exe.includes(path.sep)&&!fs.existsSync(exe)))continue;
 const probe=spawnSync(exe,[...prefix,'--version'],{encoding:'utf8'});
 if(probe.status===0){chosen=[exe,prefix];break}
}
if(!chosen){console.error('找不到可用的 Python 3。请安装 Python，或设置 CODEPATH_PYTHON 为解释器路径。');process.exit(1)}
for(const file of ['tests/exercises.py','tests/runtime-python.py','tests/model_labs.py']){
 const run=spawnSync(chosen[0],[...chosen[1],file],{stdio:'inherit'});
 if(run.status!==0)process.exit(run.status||1);
}
