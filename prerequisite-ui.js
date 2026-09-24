function prerequisitePanel(trackId){
 const ids=PREREQUISITES[trackId]||[];
 return `<section class="project-stage prerequisite-panel"><span class="eyebrow">先修导航 · 不会就从这里补</span><h2>进这门课之前，先会哪些？</h2><p>以下是直接先修课程；进入它们的目录还能继续追溯更早的基础。进度只表示完成记录，不表示已经熟练。可以自由预览，不会强迫你跳过未懂的内容。</p>${ids.length?`<div class="prerequisite-links">${ids.map(id=>{const t=TRACKS.find(t=>t.id===id),ls=LESSONS.filter(l=>l.track===id),n=ls.filter(l=>state.done[l.id]).length;return `<a class="secondary" href="#course/${id}">${esc(t.name)} <small>${n}/${ls.length} 已完成</small> →</a>`}).join('')}</div>`:'<p>没有编程先修要求。先完成下面的点击与输入练习。</p>'}<p><a class="primary" href="#learn/pre-${trackId}">先学本模块衔接课 →</a></p>${modelTracks.some(t=>t[0]===trackId)?'<p class="muted">学习顺序：衔接课 → 原理 → 小算例 → 测验 → 本机实验或项目。这里是基础到实践的路线，不把几节课或 XP 当作精通证明。</p><a class="secondary" href="model-labs.zip" download>下载 AI 本机实验包与逐步说明 ↓</a>':''}</section>`;
}
function addLessonOrientation(){
 const l=getLesson(),ls=LESSONS.filter(x=>x.track===l.track),idx=ls.indexOf(l);
 const box=document.createElement('div');box.className='lesson-orientation';
 box.innerHTML=`<a href="#course/${l.track}">← 查看先修导航与本课目录</a><span>${idx?`承接：<a href="#learn/${ls[idx-1].id}">${esc(ls[idx-1].title)}</a>`:'这是本模块的起点，先熟悉下面的新词。'}</span>${l.localLab?'<p>🖥️ 本机实验：网页不执行这段安装或训练命令。<a href="model-labs.zip" download>下载实验包和操作说明</a>；完成后保留日志，本页勾选属于自查。</p>':l.kind==='guided'?'<p>📖 概念与动手检查：按步骤完成小任务，再做右侧测验。示意文字不需要当代码运行。</p>':''}`;
 document.querySelector('.workspace').before(box);
 if(l.conceptOnly){
  document.querySelector('.editor').hidden=true;
  document.querySelector('.output-head span').textContent='本课理解检查';
  document.querySelector('.runtime-note').textContent='先完成左侧小任务，再自查和答题。本课没有需要安装或运行的程序。';
  document.querySelector('#output').textContent='概念课无需运行示意文字。完成小任务后，勾选自查项并回答问题。';
 }
}
// Stable topological ordering keeps prerequisites before dependent courses.
const orderedTracks=[],visitedTracks=new Set();
function visitTrack(id){if(visitedTracks.has(id))return;visitedTracks.add(id);for(const pre of PREREQUISITES[id]||[])visitTrack(pre);const t=TRACKS.find(t=>t.id===id);if(t)orderedTracks.push(t)}
for(const t of [...TRACKS])visitTrack(t.id);
TRACKS.splice(0,TRACKS.length,...orderedTracks);
