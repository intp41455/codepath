/* Pure domain logic shared by the UI and regression tests. */
(function(root){
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
  const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k)?x[k]:undefined;
  function dayKey(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}
  function validDay(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s}
  function indexForDay(day,size){if(!validDay(day)||size<1)throw Error('Invalid day or bank');return Math.floor(Date.parse(day)/86400000)%size}
  function reward(ledger,day,id){if(!validDay(day)||!id)throw Error('Invalid reward');return own(object(ledger),day)?{...ledger}:{...object(ledger),[day]:{id,xp:40}}}
  function xp(state,lessons){return lessons.filter(l=>state.done?.[l.id]).length*20+Object.keys(object(state.dailyRewards)).length*40}
  function normalize(raw,lessons,projects,today=dayKey()){
    const s=object(raw),out={version:1,current:lessons.some(l=>l.id===s.current)?s.current:lessons[0].id,done:{},drafts:{},notes:{},checks:{},projectChecks:{},viewedSolutions:{},projectEvidence:{},dailyRewards:{},dailyDrafts:{},mastery:{}};
    for(const l of lessons){
      const d=own(object(s.done),l.id);if(typeof d==='string'&&!Number.isNaN(Date.parse(d)))out.done[l.id]=d;
      for(const k of ['notes','drafts']){const v=own(object(s[k]),l.id);if(typeof v==='string')out[k][l.id]=v.slice(0,100000)}
      for(const k of ['checks','mastery']){const v=own(object(s[k]),l.id);if(Array.isArray(v))out[k][l.id]=v.slice(0,20).map(x=>x===true)}
      if(own(object(s.viewedSolutions),l.id)===true)out.viewedSolutions[l.id]=true;
    }
    for(const p of projects){const c=own(object(s.projectChecks),p.id);if(Array.isArray(c))out.projectChecks[p.id]=c.slice(0,p.checks.length).map(x=>x===true);const e=own(object(s.projectEvidence),p.id);if(Array.isArray(e))out.projectEvidence[p.id]=e.slice(0,5).map(r=>({score:Math.max(0,Math.min(3,Math.floor(Number(r?.score)||0))),evidence:typeof r?.evidence==='string'?r.evidence.slice(0,20000):''}))}
    for(const [d,v] of Object.entries(object(s.dailyRewards))){if(validDay(d)&&d<=today&&typeof v?.id==='string')out.dailyRewards[d]={id:v.id.slice(0,100),xp:40}}
    for(const [d,v] of Object.entries(object(s.dailyDrafts))){if(validDay(d)&&typeof v==='string')out.dailyDrafts[d]=v.slice(0,100000)}
    return out;
  }
  function merge(a,b,lessons,projects){const n=normalize(b,lessons,projects),out={...a};for(const k of ['done','drafts','notes','checks','projectChecks','viewedSolutions','projectEvidence','dailyRewards','dailyDrafts','mastery'])out[k]={...a[k],...n[k]};return normalize(out,lessons,projects)}
  const rules=[
    {id:'eval',severity:'高',re:/\b(?:eval|exec)\s*\(/,why:'动态执行字符串；外部输入可能变成代码。',fix:'把允许的操作映射到明确的函数；禁止把用户输入拼进代码。'},
    {id:'shell',severity:'高',re:/shell\s*=\s*True|os\.system\s*\(|child_process|\bexecSync\s*\(/,why:'命令执行入口；需检查命令注入及权限。',fix:'使用参数数组和命令白名单，限制执行身份及超时。'},
    {id:'html',severity:'高',re:/\.innerHTML\s*=|document\.write\s*\(/,why:'HTML 写入可能引入 XSS。可信常量与外部输入需区分。',fix:'文字优先用 textContent；富文本必须经过可信净化器。'},
    {id:'secret',severity:'高',re:/(?:api[_-]?key|password|secret|token)\s*[:=]\s*["'][^"']{8,}["']/i,why:'疑似硬编码凭据（可能是示例占位符）。',fix:'检查是否真实凭据；若泄漏则轮换。服务端从环境配置读取。'},
    {id:'sql',severity:'高',re:/(?:SELECT|INSERT|UPDATE|DELETE).*(?:\$\{|\+|\{\w+\})/i,why:'疑似动态拼接 SQL，需追踪值的来源。',fix:'使用绑定参数，动态列名采用固定白名单。'},
    {id:'tls',severity:'高',re:/verify\s*=\s*False|rejectUnauthorized\s*:\s*false/,why:'关闭 TLS 证书校验。',fix:'修复证书或信任链，不跳过校验。'},
    {id:'loop',severity:'中',re:/while\s*(?:\(\s*true\s*\)|True\s*:)/,why:'无条件循环需要可证明的退出条件。',fix:'添加最大步数、总超时和失败退出路径。'},
    {id:'swallow',severity:'中',re:/except\s*:\s*pass|catch\s*\([^)]*\)\s*\{\s*\}/,why:'吞掉异常会隐藏失败。',fix:'记录上下文并返回明确的失败状态。'},
    {id:'sudo',severity:'高',re:/curl.*\|.*(?:bash|sh)|chmod\s+777|rm\s+-[a-z]*r[a-z]*f/i,why:'高权限、远程脚本或递归删除需要人工核对。',fix:'先下载审查；使用最小权限；核对绝对目标路径。'}
  ];
  function review(code){const result=[];String(code).split('\n').forEach((line,i)=>rules.forEach(r=>{if(r.re.test(line))result.push({id:r.id,severity:r.severity,line:i+1,why:r.why,fix:r.fix})}));return result}
  const api={dayKey,validDay,indexForDay,reward,xp,normalize,merge,review};root.LearningCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
