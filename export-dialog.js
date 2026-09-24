/* Keep a copyable fallback for browsers that suppress generated downloads. */
function exportTextFile(name,body,type){
 const url=URL.createObjectURL(new Blob([body],{type})),a=document.createElement('a');
 a.href=url;a.download=name;a.hidden=true;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
 let dialog=document.querySelector('#export-dialog');
 if(!dialog){
   dialog=document.createElement('dialog');dialog.id='export-dialog';
   dialog.innerHTML='<div class="dialog-head"><h2 id="export-title">导出记录</h2><button class="icon-button" id="export-close" aria-label="关闭导出">×</button></div><p>已发起文件下载。如果浏览器没有保存文件，可复制下方完整内容，在本机文本编辑器中另存为指定文件名。</p><label for="export-content">完整导出内容</label><textarea id="export-content" class="export-content" readonly spellcheck="false"></textarea><div class="support-row"><button class="primary" id="export-copy">复制完整内容</button><button class="secondary" id="export-select">全选内容</button></div><p id="export-message" role="status"></p>';
   document.body.append(dialog);
   dialog.querySelector('#export-close').onclick=()=>dialog.close();
   dialog.querySelector('#export-copy').onclick=async()=>{try{await navigator.clipboard.writeText(dialog.querySelector('#export-content').value);dialog.querySelector('#export-message').textContent='已复制。请在本机保存为上方文件名。'}catch{dialog.querySelector('#export-content').select();dialog.querySelector('#export-message').textContent='请按 Ctrl+C / ⌘+C 复制。'}};
   dialog.querySelector('#export-select').onclick=()=>{dialog.querySelector('#export-content').focus();dialog.querySelector('#export-content').select()};
 }
 dialog.querySelector('#export-title').textContent=name;
 dialog.querySelector('#export-content').value=body;
 dialog.querySelector('#export-message').textContent='';
 if(!dialog.open)dialog.showModal();
}
