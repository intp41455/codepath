const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../dist'),core=require('../dist/learning-core.js');
const files=['curriculum.js','foundations.js','backend.js','ai-lessons.js','mastery.js','projects.js','new-courses.js','new-projects.js','daily.js'];
const context={};context.window=context;vm.createContext(context);for(const name of files)vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
const {LESSONS:lessons,TRACKS:tracks,PROJECTS:projects,DAILY_CHALLENGES:daily}=context;
const ts=require('../dist/vendor/typescript/typescript.js');
const libs=Object.fromEntries(['lib.es5.d.ts','lib.es2015.promise.d.ts','lib.decorators.d.ts','lib.decorators.legacy.d.ts'].map(n=>[n,fs.readFileSync(path.join(root,'vendor/typescript',n),'utf8')]));
async function run(code,kind='javascript',testCode='assert(true);'){
 const messages=[],c={ts,self:{postMessage:m=>messages.push(m)},payload:{kind,code,test:testCode,libs}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'js-runner.js'),'utf8'),c);await vm.runInContext('self.onmessage({data:payload})',c,{timeout:15000});return messages.at(-1);
}
test('all curriculum IDs, prerequisites and practice contracts are complete',()=>{
 assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length);assert.equal(new Set(tracks.map(t=>t.id)).size,tracks.length);
 for(const l of lessons){for(const k of ['title','intro','concept','example','explain','steps','starter','solution','hint','reflection'])assert.ok(l[k]!==undefined,l.id+': '+k);assert.ok(tracks.some(t=>t.id===l.track));if(l.kind==='guided'){assert.ok(l.checks.length>=2,l.id);assert.ok(l.quiz.answer>=0&&l.quiz.answer<l.quiz.options.length,l.id)}else assert.ok(l.test||l.expected,l.id)}
 for(const t of tracks){assert.ok(lessons.some(l=>l.track===t.id));assert.ok(t.source.startsWith('https://'))}
 for(const p of projects){assert.ok(p.stages.length>=2);assert.ok(p.checks.length>=3)}
 assert.equal(lessons.length,129);assert.equal(projects.length,14);
});
test('all delivered JavaScript parses',()=>{for(const n of fs.readdirSync(root).filter(n=>n.endsWith('.js')))new vm.Script(fs.readFileSync(path.join(root,n),'utf8'),{filename:n})});
test('daily reward is idempotent across repeated submissions and backup merge',()=>{
 let s=core.normalize({},lessons,projects,'2026-09-22');s.dailyRewards=core.reward(s.dailyRewards,'2026-09-22','sum');s.dailyRewards=core.reward(s.dailyRewards,'2026-09-22','sum');assert.equal(core.xp(s,lessons),40);s=core.merge(s,JSON.parse(JSON.stringify(s)),lessons,projects);assert.equal(core.xp(s,lessons),40);
 s.done[lessons[0].id]='2026-09-22T00:00:00Z';assert.equal(core.xp(s,lessons),60);
 s.dailyRewards=core.reward(s.dailyRewards,'2026-09-23','new');assert.equal(core.xp(s,lessons),100);
});
test('daily calendar handles leap dates and changes deterministically',()=>{assert.equal(core.validDay('2026-02-30'),false);assert.equal(core.validDay('2024-02-29'),true);assert.equal(core.dayKey(new Date(2026,8,22,23,59)),'2026-09-22');assert.equal((core.indexForDay('2026-09-22',14)+1)%14,core.indexForDay('2026-09-23',14));assert.throws(()=>core.indexForDay('oops',14))});
test('malformed persisted state does not become trusted UI data',()=>{const s=core.normalize({current:'oops',notes:{'py-01':{}},done:{'py-01':'bad'},drafts:null,checks:{'py-01':['false',true]},dailyRewards:{'2099-01-01':{id:'x',xp:999},'2026-02-30':{id:'x'}}},lessons,projects,'2026-09-22');assert.equal(s.current,'py-01');assert.deepEqual(s.notes,{});assert.deepEqual(s.done,{});assert.deepEqual(s.checks['py-01'],[false,true]);assert.deepEqual(s.dailyRewards,{});assert.doesNotThrow(()=>core.normalize(null,lessons,projects));});
test('old backups migrate without losing notes, drafts or evidence',()=>{const s=core.normalize({version:1,notes:{'py-01':'我的笔记'},drafts:{'py-01':'print(1)'},done:{'py-01':'2026-09-21T00:00:00Z'}},lessons,projects);assert.equal(s.notes['py-01'],'我的笔记');assert.equal(s.drafts['py-01'],'print(1)');assert.equal(core.xp(s,lessons),20);assert.deepEqual(s.dailyRewards,{})});
test('static review catches seeded risks and keeps safe negative controls clear',()=>{for(const code of ['eval(userInput)','os.system(command)','element.innerHTML = userInput','requests.get(url, verify=False)','while True:','chmod 777 file','const api_key = "not-a-real-key"','query = "SELECT * FROM users WHERE id=" + userId'])assert.ok(core.review(code).length,code);for(const code of ['element.textContent = userInput','const total = a + b;','db.execute("SELECT * FROM users WHERE id = ?", [userId])'])assert.equal(core.review(code).length,0,code);assert.equal(core.review('safe();\neval(x)')[0].line,2)});
test('opaque runner blocks same-origin access and limits external connections by construction',()=>{const s=fs.readFileSync(path.join(root,'sandbox.js'),'utf8');assert.match(s,/setAttribute\('sandbox','allow-scripts'\)/);assert.doesNotMatch(s,/allow-same-origin/);assert.match(s,/e.source!==f.contentWindow/);assert.match(s,/connect-src/);assert.match(s,/terminate\(\)/)});
for(const l of lessons.filter(l=>['javascript','typescript'].includes(l.kind))){
 test(l.id+' reference passes real behavioral assertions',async()=>{const r=await run(l.solution,l.kind,l.test);assert.equal(r.passed,true,JSON.stringify(r))});
 test(l.id+' unfinished starter is rejected',async()=>{const r=await run(l.starter,l.kind,l.test);assert.equal(r.passed,false,JSON.stringify(r))});
}
test('TypeScript rejects a semantically wrong type, not merely invalid syntax',async()=>{const r=await run('const count: number = "wrong";','typescript');assert.equal(r.passed,false);assert.match(r.error,/not assignable/) });
test('valid syntax with wrong behavior is caught by assertions',async()=>{const r=await run('function add(a,b){return a-b;}','javascript','assert(add(2,3)===5, "sum mismatch");');assert.equal(r.passed,false);assert.match(r.error,/sum mismatch/) });
test('no business assertions does not claim a pass',async()=>{const r=await run('console.log("hello");','javascript','');assert.equal(r.passed,false);assert.match(r.output,/hello/) });
test('comments and unreachable assertions cannot claim a pass',async()=>{for(const checks of ['// assert(true);','if(false) assert(true);','console.log("looks okay");']){const r=await run('const n=1;','javascript',checks);assert.equal(r.passed,false);assert.equal(r.checks,0)}});
test('output flood stops with an explicit error',async()=>{const r=await run('console.log("x".repeat(20001));');assert.equal(r.passed,false);assert.match(r.error,/20,000/) });
for(const d of daily){test('daily '+d.id+' valid schema / negative control',async()=>{if(d.kind==='reading'){assert.ok(d.answer>=0&&d.answer<d.options.length);assert.ok(d.explanation.length>20)}else{const r=await run(d.starter,d.kind,d.test);assert.equal(r.passed,false)}})}
test('daily algorithm solutions really pass',async()=>{const answers={sum:'function sumPositive(xs){return xs.filter(x=>x>0).reduce((a,b)=>a+b,0)}',max:'function maximum(xs){return xs.length?Math.max(...xs):null}',unique:'function unique(xs){return [...new Set(xs)]}',count:'function count(xs,t){return xs.filter(x=>x===t).length}',reverse:'function reversed(xs){return [...xs].reverse()}',clamp:'function clamp(n,min,max){return Math.max(min,Math.min(max,n))}',sorted:'function isSorted(xs){return xs.every((x,i)=>i===0||x>=xs[i-1])}'};for(const d of daily.filter(d=>d.kind!=='reading')){const r=await run(answers[d.id],d.kind,d.test);assert.equal(r.passed,true,d.id+JSON.stringify(r))}});
