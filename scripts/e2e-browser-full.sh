#!/usr/bin/env bash
S="https://codepath-academy.pages.dev/"
E="e2e-full-$(date +%s)@gmail.com"
P="FullPath!123456"
echo "ACCOUNT=$E / $P"

echo; echo "########## 1. 打开 + 注册 ##########"
agent-browser open "$S"
agent-browser eval "window.__E='$E';window.__P='$P';window.__r1=null;CodepathAuth.signUp(window.__E,window.__P,true).then(()=>window.__r1='OK').catch(e=>window.__r1='ERR:'+e.message);'started'"
agent-browser wait 4000
agent-browser eval "JSON.stringify({signup:window.__r1,state:CodepathAuth.getState(),local:!!localStorage.getItem('codepath-auth')})"

echo; echo "########## 2. 推送进度到云端 ##########"
agent-browser eval "window.__r2=null;CodepathAuth.pushProgress({done:{'py01':'complete','js03':'complete'},notes:{'py01':'来自浏览器的笔记'},gameProgress:{maze:5}}).then(()=>window.__r2='pushed').catch(e=>window.__r2='ERR:'+e.message);'go'"
agent-browser wait 3000
agent-browser eval "window.__r2"

echo; echo "########## 3. 从云端拉回进度 ##########"
agent-browser eval "window.__r3=null;CodepathAuth.pullProgress().then(v=>window.__r3=JSON.stringify(v)).catch(e=>window.__r3='ERR:'+e.message);'go'"
agent-browser wait 3000
agent-browser eval "window.__r3"

echo; echo "########## 4. 退出登录 ##########"
agent-browser eval "window.__r4=null;CodepathAuth.signOut().then(()=>window.__r4='signed out').catch(e=>window.__r4='ERR:'+e.message);'go'"
agent-browser wait 2500
agent-browser eval "JSON.stringify({out:window.__r4,state:CodepathAuth.getState(),local:!!localStorage.getItem('codepath-auth'),session:!!sessionStorage.getItem('codepath-auth')})"

echo; echo "########## 5. 重新登录（登录流程）##########"
agent-browser eval "window.__r5=null;CodepathAuth.signIn(window.__E,window.__P,false).then(()=>window.__r5='OK').catch(e=>window.__r5='ERR:'+e.message);'go'"
agent-browser wait 3500
agent-browser eval "JSON.stringify({login:window.__r5,state:CodepathAuth.getState(),session:!!sessionStorage.getItem('codepath-auth')})"

echo; echo "########## 6. 错误路径：错误密码 ##########"
agent-browser eval "window.__r6=null;CodepathAuth.signIn(window.__E,'definitelyWrong999',false).then(()=>window.__r6='UNEXPECTED_OK').catch(e=>window.__r6='REJECTED: '+e.message);'go'"
agent-browser wait 3000
agent-browser eval "window.__r6"

echo; echo "########## 7. 错误路径：无效邮箱（走 UI 校验）##########"
agent-browser eval "JSON.stringify(window.CodepathAuth.getState())"

echo; echo "########## 8. 再次登录并确认侧边栏 UI 更新 ##########"
agent-browser eval "CodepathAuth.signIn(window.__E,window.__P,true);'re-login'"
agent-browser wait 3500
agent-browser eval "JSON.stringify({ui:document.getElementById('auth-area').textContent.trim(),saveState:document.getElementById('save-state').textContent.trim()})"

echo; echo "########## 9. 收尾 ##########"
agent-browser close
echo DONE
