/* Opaque-origin iframe + disposable worker: learner code has no site storage/DOM access. */
class IsolatedRunner{
  constructor(){this.closed=false;this.frame=null;this.onmessage=null;this.onerror=null;this.id=crypto.randomUUID()}
  async postMessage(payload){try{
    const isJS=['javascript','typescript'].includes(payload.kind);
    let source=await fetch(isJS?'js-runner.js':'runner.js').then(r=>{if(!r.ok)throw Error('运行器下载失败');return r.text()});
    if(payload.kind==='typescript'){
      const base='vendor/typescript/';
      const TS_CDN='https://cdn.jsdelivr.net/npm/typescript@5.9.3/lib/typescript.js';
      const names=['lib.es5.d.ts','lib.es2015.promise.d.ts','lib.decorators.d.ts','lib.decorators.legacy.d.ts'];
      const read=async name=>{
        const r=await fetch(base+name);
        if(r.ok)return r.text();
        if(name==='typescript.js'){
          // 部分分发渠道（如公开仓库受网络限制）不捆绑 9MB 编译器主体，
          // 自动回退到 jsDelivr 上同版本（5.9.3）官方构建；本地有文件时仍优先本地。
          const c=await fetch(TS_CDN);
          if(!c.ok)throw Error('TypeScript 文件缺失：'+name+'（本地与 CDN 均不可用，请检查网络）');
          return c.text();
        }
        throw Error('TypeScript 文件缺失：'+name);
      };
      payload={...payload,libs:Object.fromEntries(await Promise.all(names.map(async n=>[n,await read(n)])))};
      source=(await read('typescript.js'))+'\n'+source;
    }
    if(this.closed)return;
    const f=document.createElement('iframe');this.frame=f;f.hidden=true;f.setAttribute('sandbox','allow-scripts');f.setAttribute('title','隔离的代码执行器');
    const relay=`const id=${JSON.stringify(this.id)};let w;addEventListener('message',e=>{if(e.source!==parent||e.data.id!==id||w)return;w=new Worker(URL.createObjectURL(new Blob([e.data.source],{type:'text/javascript'})));w.onmessage=e=>parent.postMessage({id,data:e.data},'*');w.onerror=()=>parent.postMessage({id,error:true},'*');w.postMessage(e.data.payload)});parent.postMessage({id,ready:true},'*');`;
    const cdn=isJS?'':' https://cdn.jsdelivr.net';
    f.srcdoc=`<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:${cdn}; worker-src blob:; connect-src${cdn||" 'none'"};"><script>${relay}<\/script>`;
    this.listener=e=>{if(e.source!==f.contentWindow||e.data?.id!==this.id)return;if(e.data.ready){f.contentWindow.postMessage({id:this.id,source,payload},'*')}else if(e.data.error){this.onerror?.(Error('隔离运行环境失败'))}else this.onmessage?.({data:e.data.data})};
    window.addEventListener('message',this.listener);document.body.append(f);
  }catch(e){if(!this.closed)this.onerror?.(e)}}
  terminate(){this.closed=true;if(this.listener)window.removeEventListener('message',this.listener);this.frame?.remove()}
}
