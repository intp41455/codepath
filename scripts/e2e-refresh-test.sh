#!/usr/bin/env bash
S="http://127.0.0.1:8791/"
E="e2e-refresh-$(date +%s)@gmail.com"
P="Refresh!123456"
echo "ACCOUNT=$E"

echo; echo "########## 1. 打开本地(打过补丁的)站点并注册 ##########"
agent-browser open "$S"
agent-browser eval "window.__r=null;CodepathAuth.signUp('$E','$P',true).then(()=>window.__r='OK').catch(e=>window.__r='ERR:'+e.message);'go'"
agent-browser wait 4000
agent-browser eval "JSON.stringify({signup:window.__r,state:CodepathAuth.getState()})"

echo; echo "########## 2. 确认 refresh_token 已落盘 ##########"
agent-browser eval "(function(){var d=JSON.parse(localStorage.getItem('codepath-auth')||'{}');return JSON.stringify({hasAt:!!d.at,hasRt:!!d.rt,rtLen:(d.rt||'').length,email:d.email})})()"

echo; echo "########## 3. 模拟 access_token 过期（写坏 token 后刷新页面）##########"
agent-browser eval "(function(){var d=JSON.parse(localStorage.getItem('codepath-auth')||'{}');window.__oldAt=d.at;d.at='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.BROKEN.BROKEN';localStorage.setItem('codepath-auth',JSON.stringify(d));return 'corrupted'})()"
agent-browser reload
agent-browser wait 2500
agent-browser eval "(function(){var d=JSON.parse(localStorage.getItem('codepath-auth')||'{}');return JSON.stringify({loadedAt:d.at,hasRt:!!d.rt})})()"

echo; echo "########## 4. 关键测试：过期 token 下推送进度 → 应自动续期并成功 ##########"
agent-browser eval "window.__p=null;CodepathAuth.pushProgress({done:{refresh:'auto-renewed'},notes:{k:'v'}}).then(v=>window.__p='pushResult='+v).catch(e=>window.__p='ERR:'+e.message);'go'"
agent-browser wait 5000
agent-browser eval "(function(){var d=JSON.parse(localStorage.getItem('codepath-auth')||'{}');var old=window.__oldAt||'';return JSON.stringify({push:window.__p,tokenReplaced:(d.at||'')!==old&&(d.at||'').indexOf('BROKEN')<0,stillLoggedIn:!!CodepathAuth.getState().accessToken})})()"

echo; echo "########## 5. 续期后拉回数据（验证数据真的写进去了）##########"
agent-browser eval "window.__q=null;CodepathAuth.pullProgress().then(v=>window.__q=JSON.stringify(v)).catch(e=>window.__q='ERR:'+e.message);'go'"
agent-browser wait 4000
agent-browser eval "window.__q"

echo; echo "########## 6. 反向测试：无 refresh_token + 坏 token → 应如实登出 ##########"
agent-browser eval "(function(){var d=JSON.parse(localStorage.getItem('codepath-auth')||'{}');d.at='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.BROKEN.BROKEN';delete d.rt;localStorage.setItem('codepath-auth',JSON.stringify(d));return 'no-rt'})()"
agent-browser reload
agent-browser wait 2500
agent-browser eval "window.__z=null;CodepathAuth.pushProgress({done:{x:1}}).then(v=>window.__z='push='+v).catch(e=>window.__z='ERR');'go'"
agent-browser wait 5000
agent-browser eval "JSON.stringify({push:window.__z,state:CodepathAuth.getState(),storageCleared:!localStorage.getItem('codepath-auth'),uiText:document.getElementById('auth-area').textContent.trim()})"

echo; echo "########## 7. 收尾 ##########"
agent-browser close
echo DONE
