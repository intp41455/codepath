#!/usr/bin/env bash
S="https://codepath-academy.pages.dev/"
E="e2e-live-$(date +%s)@gmail.com"
P="LiveSmoke!123456"

echo "########## 线上冒烟：注册 → 推 → 拉 → 续期能力 ##########"
agent-browser open "$S"
agent-browser eval "JSON.stringify({hasAuth:typeof window.CodepathAuth,hasRefresh:typeof window.CodepathAuth.refreshSession})"

echo "--- 1) 注册 ---"
agent-browser eval "window.__a=null;CodepathAuth.signUp('$E','$P',true).then(()=>window.__a='OK').catch(e=>window.__a='ERR:'+e.message);'go'"
agent-browser wait 4000
agent-browser eval "JSON.stringify({signup:window.__a,state:CodepathAuth.getState(),hasRt:(function(){var d=JSON.parse(localStorage.getItem('codepath-auth')||'{}');return !!d.rt})()})"

echo "--- 2) 推送 ---"
agent-browser eval "window.__b=null;CodepathAuth.pushProgress({done:{live:'deployed'}}).then(v=>window.__b='push='+v).catch(e=>window.__b='ERR');'go'"
agent-browser wait 4000
agent-browser eval "window.__b"

echo "--- 3) 拉回 ---"
agent-browser eval "window.__c=null;CodepathAuth.pullProgress().then(v=>window.__c=JSON.stringify(v)).catch(e=>window.__c='ERR');'go'"
agent-browser wait 3500
agent-browser eval "window.__c"

echo "--- 4) 续期能力：坏 token 下再推 ---"
agent-browser eval "(function(){var d=JSON.parse(localStorage.getItem('codepath-auth')||'{}');window.__old=d.at;d.at='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.BROKEN.SIG';localStorage.setItem('codepath-auth',JSON.stringify(d));return 'broken'})()"
agent-browser reload
agent-browser wait 2500
agent-browser eval "window.__d=null;CodepathAuth.pushProgress({done:{live:'after-refresh'}}).then(v=>window.__d='push='+v).catch(e=>window.__d='ERR');'go'"
agent-browser wait 5000
agent-browser eval "(function(){var d=JSON.parse(localStorage.getItem('codepath-auth')||'{}');return JSON.stringify({result:window.__d,tokenReplaced:(d.at||'')!==window.__old&&(d.at||'').indexOf('BROKEN')<0})})()"

echo "--- 5) 收尾 ---"
agent-browser close
echo DONE
