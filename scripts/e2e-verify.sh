#!/usr/bin/env bash
# ============================================================
# codepath 登录/进度云同步 · 端到端验证脚本
# 用法：先把 Supabase 控制台的 Email Confirmation 关掉，再跑本脚本
#   bash scripts/e2e-verify.sh
# 依赖：curl、jq（没有 jq 也能跑，只缺部分解析）
# 说明：
#   - 全程用 anon key，测试完可手动在 Supabase 删掉 e2e-* 账号
#   - 关 confirmation 后 signup 不再发信，立即返回可用账号
# ============================================================
set -uo pipefail

BASE="https://zknmsszhupuvhtnkzwoo.supabase.co"
# 完整 208 字符 anon key（前端可公开）
KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprbm1zc3podXB1dnRoa3p3b28iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4NTM1MDA2NiwiZXhwIjoyMTAwOTI2MDY2fQ.bNPQi-e-JonSJUN4vHweMVMhpmWwq4QPvTtIY3KBN1w'
# 若本地有抓取好的 key 文件，优先用（避免脚本里写死）
if [ -f "$TEMP/anon-key.txt" ]; then KEY="$(tr -d '\n' < "$TEMP/anon-key.txt")"; fi

EMAIL="e2e-codepath-$(date +%s)@gmail.com"
PASS="CodepathE2E!$(date +%s)"
HDRS=(-H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json")

say(){ echo -e "\n===== $1 ====="; }

say "0) anon key 可用性（特定表端点应 200）"
curl -s --ssl-no-revoke -o /dev/null -w "GET /rest/v1/codepath_progress -> HTTP %{http_code}\n" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" "$BASE/rest/v1/codepath_progress?limit=1"

say "1) signup（关 confirmation 后应 200，返回 access_token）"
SU=$(curl -s --ssl-no-revoke "${HDRS[@]}" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" "$BASE/auth/v1/signup")
echo "resp: $(echo "$SU" | head -c 300)"

# 取 access_token：优先用 signup 直接返回的；没有就走 login
TOKEN=$(echo "$SU" | python -c "import sys,json;d=json.load(sys.stdin);print(d.get('access_token') or d.get('user',{}).get('id') or '')" 2>/dev/null)

say "2) login（换 user access_token）"
LG=$(curl -s --ssl-no-revoke "${HDRS[@]}" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" "$BASE/auth/v1/token?grant_type=password")
echo "resp: $(echo "$LG" | head -c 300)"
UTOKEN=$(echo "$LG" | python -c "import sys,json;print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
echo "user_token_len=${#UTOKEN}"
[ -n "$UTOKEN" ] || { echo "!! 拿不到 user token，后续全挂。若 429 说明 confirmation 还没关 / 发信仍被限。"; exit 1; }

# 用户侧请求头
USR=(-H "apikey: $KEY" -H "Authorization: Bearer $UTOKEN" -H "Content-Type: application/json")

say "3) upsert 进度（on_conflict=owner_email，user token）"
STATE='{"done":{"py01":"complete"},"notes":{"py01":"hello cloud"},"gameProgress":{"maze":3}}'
UP=$(curl -s --ssl-no-revoke -w "\nHTTP=%{http_code}" "${USR[@]}" \
  -d "{\"owner_email\":\"$EMAIL\",\"state\":$STATE}" \
  "$BASE/rest/v1/codepath_progress?on_conflict=owner_email")
echo "$UP" | head -c 400

say "4) pull 回读（user token，按 owner_email 过滤）"
PL=$(curl -s --ssl-no-revoke -w "\nHTTP=%{http_code}" "${USR[@]}" \
  "$BASE/rest/v1/codepath_progress?owner_email=eq.$EMAIL&limit=1")
echo "$PL" | head -c 400

say "5) RLS 负控（anon 身份读，应 401/403 拿不到别人数据）"
NA=$(curl -s --ssl-no-revoke -o /dev/null -w "HTTP=%{http_code}" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  "$BASE/rest/v1/codepath_progress?owner_email=eq.$EMAIL&limit=1")
echo "anon 读他人进度 -> HTTP $NA（期望 200 但返回空数组 []，因 anon 的 auth.uid() 为 null，RLS 过滤掉一切；若返回了数据则是 RLS 失效！）"
NA_BODY=$(curl -s --ssl-no-revoke -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  "$BASE/rest/v1/codepath_progress?owner_email=eq.$EMAIL&limit=1")
echo "anon 读 body: $NA_BODY"

say "6) RLS 跨账号负控（第二个账号读第一个账号的 owner_email，应拿不到）"
EMAIL2="e2e-codepath-b-$(date +%s)@gmail.com"
PASS2="CodepathE2E!$(date +%s)"
curl -s --ssl-no-revoke "${HDRS[@]}" -d "{\"email\":\"$EMAIL2\",\"password\":\"$PASS2\"}" "$BASE/auth/v1/signup" >/dev/null
LG2=$(curl -s --ssl-no-revoke "${HDRS[@]}" -d "{\"email\":\"$EMAIL2\",\"password\":\"$PASS2\"}" "$BASE/auth/v1/token?grant_type=password")
UTOKEN2=$(echo "$LG2" | python -c "import sys,json;print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
X=$(curl -s --ssl-no-revoke -H "apikey: $KEY" -H "Authorization: Bearer $UTOKEN2" -H "Content-Type: application/json" \
  "$BASE/rest/v1/codepath_progress?owner_email=eq.$EMAIL&limit=1")
echo "账号B 读 账号A($EMAIL) 的进度 -> $X（期望 [] 空，证明 RLS 隔离）"

say "完成"
echo "测试账号：$EMAIL / $PASS  （可保留复查，也可在 Supabase 删掉）"
echo "账号B：  $EMAIL2 / $PASS2"
