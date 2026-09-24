/*
 * codepath 登录模块（零依赖，fetch 直连 Supabase REST API）
 *
 * 设计原则：
 * - 不引任何 SDK，纯 fetch 调用 Supabase Auth + PostgREST
 * - 未登录时匿名模式不受影响（进度仍存 localStorage）
 * - 登录后 app.js save() 调用 CodepathAuth.pushProgress(state) 推送云端
 * - token 存 sessionStorage（关标签即清除）；"记住我"则存 localStorage
 *
 * 挂接点：
 * - index.html 侧边栏 #auth-area 渲染登录按钮 / 用户信息
 * - index.html #auth-dialog 渲染登录/注册表单
 * - app.js save() 末尾调用 window.CodepathAuth?.pushProgress?.(state)
 */
(function(){
  const SUPABASE_URL='https://jhccytzjmwetdepbqife.supabase.co';
  const SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoY2N5dHpqbXdldGRlcGJxaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMzkwMDIsImV4cCI6MjEwNTYxNTAwMn0.kjzPIqH08hU9f_xUjCXd-UoWZZUNMKse-klHu2jPRTw';
  const AUTH_HEADS={'apikey':SUPABASE_ANON,'Authorization':'Bearer '+SUPABASE_ANON,'Content-Type':'application/json'};
  const REM_KEY='codepath-auth';
  let user=null,accessToken=null,refreshToken=null;

  // ===== Token 管理 =====
  function loadSession(){
    const raw=localStorage.getItem(REM_KEY)||sessionStorage.getItem(REM_KEY);
    if(!raw)return;
    try{const d=JSON.parse(raw);if(d.at){accessToken=d.at;refreshToken=d.rt||null;user=d.email||null}}catch{}
  }
  function storeSession(at,rt,email,remember){
    const raw=JSON.stringify({at,rt:rt||null,email:email||user});
    if(remember){localStorage.setItem(REM_KEY,raw);sessionStorage.removeItem(REM_KEY)}
    else{sessionStorage.setItem(REM_KEY,raw);localStorage.removeItem(REM_KEY)}
  }
  function clearSession(){
    accessToken=null;refreshToken=null;user=null;
    localStorage.removeItem(REM_KEY);sessionStorage.removeItem(REM_KEY);
    onUserChange();
  }

  // ===== Supabase REST =====
  async function signUp(email,pass,remember=true){
    const r=await fetch(SUPABASE_URL+'/auth/v1/signup',{method:'POST',headers:AUTH_HEADS,body:JSON.stringify({email,password:pass})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.msg||d.error_description||('注册失败 '+r.status));
    if(!d.access_token)throw new Error('注册已受理，但该账号需要邮箱确认后才能登录。请先在 Supabase 关闭 Email Confirmation，或完成邮箱验证后重试。');
    accessToken=d.access_token;refreshToken=d.refresh_token||null;user=d.user?.email||email;
    storeSession(accessToken,refreshToken,user,remember);onUserChange();
    return d;
  }
  async function signIn(email,pass,remember=true){
    const r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:AUTH_HEADS,body:JSON.stringify({email,password:pass})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.msg||d.error_description||('登录失败 '+r.status));
    accessToken=d.access_token;refreshToken=d.refresh_token||null;user=d.user?.email||email;
    storeSession(accessToken,refreshToken,user,remember);onUserChange();
    return d;
  }
  async function signOut(){
    if(accessToken){try{await fetch(SUPABASE_URL+'/auth/v1/logout',{method:'POST',headers:{...AUTH_HEADS,Authorization:'Bearer '+accessToken}})}catch{}}
    clearSession();
  }

  // ===== Token 自动续期（access_token 默认 1 小时过期）=====
  async function refreshSession(){
    if(!refreshToken)return false;
    try{
      const r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{
        method:'POST',headers:AUTH_HEADS,body:JSON.stringify({refresh_token:refreshToken})
      });
      if(!r.ok)return false;
      const d=await r.json();
      if(!d.access_token)return false;
      accessToken=d.access_token;refreshToken=d.refresh_token||refreshToken;
      if(d.user&&d.user.email)user=d.user.email;
      storeSession(accessToken,refreshToken,user,!!localStorage.getItem(REM_KEY));
      onUserChange();
      return true;
    }catch{return false}
  }
  // 带自动续期的请求：遇 401 先续期一次再重试；续期失败则如实登出（不再假装已登录）
  async function authFetch(url,opts){
    const o=opts||{},h=o.headers||{};
    let r=await fetch(url,Object.assign({},o,{headers:Object.assign({},h,{Authorization:'Bearer '+accessToken})}));
    if(r.status===401){
      if(await refreshSession()){
        r=await fetch(url,Object.assign({},o,{headers:Object.assign({},h,{Authorization:'Bearer '+accessToken})}));
      }else{clearSession()}
    }
    return r;
  }

  // ===== 进度云同步 =====
  async function pushProgress(state){
    if(!accessToken||!state)return false;
    try{
      const r=await authFetch(SUPABASE_URL+'/rest/v1/codepath_progress?on_conflict=owner_email',{
        method:'POST',
        headers:Object.assign({},AUTH_HEADS,{'Prefer':'resolution=merge-duplicates,return=minimal'}),
        body:JSON.stringify({owner_email:user||'anon',state:state,updated_at:new Date().toISOString()})
      });
      return r.ok;
    }catch{return false}
  }
  async function pullProgress(){
    if(!accessToken||!user)return null;
    try{
      const r=await authFetch(SUPABASE_URL+'/rest/v1/codepath_progress?owner_email=eq.'+encodeURIComponent(user)+'&limit=1',{headers:AUTH_HEADS});
      if(!r.ok)return null;
      const rows=await r.json();
      return rows[0]?.state||null;
    }catch{return null}
  }

  // ===== UI =====
  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function onUserChange(){
    const area=document.getElementById('auth-area');
    if(!area)return;
    if(user){
      area.innerHTML=`<div class="auth-user"><span class="avatar auth-avatar">${esc(user[0].toUpperCase())}</span><div><b>${esc(user.split('@')[0])}</b><small>已登录 · 进度云同步</small></div><button class="icon-button auth-logout" id="auth-logout" title="退出登录">⏻</button></div>`;
      area.querySelector('#auth-logout')?.addEventListener('click',signOut);
      const ss=document.getElementById('save-state');if(ss)ss.textContent='已登录 · 云端同步';
    }else{
      area.innerHTML=`<button class="secondary auth-login-btn" id="auth-login-btn">🔑 登录 / 注册</button>`;
      area.querySelector('#auth-login-btn')?.addEventListener('click',openDialog);
    }
  }
  function openDialog(){const d=document.getElementById('auth-dialog');if(d)d.showModal()}

  function bindDialog(){
    const d=document.getElementById('auth-dialog');if(!d)return;
    const emailI=d.querySelector('#auth-email'),passI=d.querySelector('#auth-password');
    const modeI=d.querySelector('#auth-mode'),msg=d.querySelector('#auth-msg'),btn=d.querySelector('#auth-submit');
    d.querySelector('#close-auth')?.addEventListener('click',()=>d.close());
    // 点对话框外关闭
    d.addEventListener('click',e=>{if(e.target===d)d.close()});
    d.querySelector('#auth-toggle')?.addEventListener('click',()=>{
      const toRegister=modeI.value==='login';
      modeI.value=toRegister?'register':'login';
      d.querySelector('h2').textContent=toRegister?'注册账号':'登录循码';
      d.querySelector('.auth-sub').textContent=toRegister?'注册后自动创建云端进度空间':'登录后恢复你的跨设备进度';
      btn.textContent=toRegister?'注册并登录':'登录';
      msg.textContent='';
    });
    btn?.addEventListener('click',async()=>{
      const email=(emailI?.value||'').trim(),pass=(passI?.value||'');
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){msg.textContent='请输入有效邮箱';return}
      if(pass.length<6){msg.textContent='密码至少 6 位';return}
      const remember=d.querySelector('#auth-remember')?.checked!==false;
      btn.disabled=true;msg.textContent='';
      try{
        if(modeI.value==='register'){await signUp(email,pass,remember);toastAuth('已注册并登录')}
        else{await signIn(email,pass,remember);toastAuth('欢迎回来')}
        d.close();msg.textContent='';emailI.value='';passI.value='';
      }catch(e){msg.textContent=String(e.message||e).slice(0,140)}
      btn.disabled=false;
    });
  }
  let _t;function toastAuth(s){const t=document.getElementById('toast');if(!t)return;t.textContent=s;t.classList.add('visible');clearTimeout(_t);_t=setTimeout(()=>t.classList.remove('visible'),2600)}

  // ===== 启动 =====
  function init(){
    loadSession();
    onUserChange();
    bindDialog();
    // 已登录 → 拉取云端进度，比本地多则合并并刷新
    if(accessToken&&user){
      pullProgress().then(cloud=>{
        if(!cloud||!window.LearningCore)return;
        try{
          const KEY='codepath-learning-v1';
          const local=JSON.parse(localStorage.getItem(KEY)||'null')||{};
          const cloudDone=Object.keys(cloud.done||{}).length,localDone=Object.keys(local.done||{}).length;
          if(cloudDone>localDone){
            const merged=window.LearningCore.merge(local,cloud,window.LESSONS||[],window.PROJECTS||[]);
            localStorage.setItem(KEY,JSON.stringify(merged));
            location.reload();
          }
        }catch{}
      }).catch(()=>{});
    }
  }

  window.CodepathAuth={signUp,signIn,signOut,pushProgress,pullProgress,refreshSession,openDialog,loadSession,isLoggedIn:()=>!!accessToken,getUser:()=>user,getState:()=>({user,accessToken:!!accessToken})};

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
