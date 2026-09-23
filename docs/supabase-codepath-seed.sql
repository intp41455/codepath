-- ============================================================
-- codepath（循码）进度云同步 · Supabase 建表脚本
-- 使用方法：Supabase Dashboard → SQL Editor → 粘贴执行
-- 与 gode 同一 Supabase 实例（zknmsszhupuvhtnkzwoo）
-- ============================================================

-- 1) 进度表：每个用户一行，state 存完整学习状态 JSON
create table if not exists public.codepath_progress (
  id bigint generated always as identity primary key,
  owner_email text not null unique,          -- auth.users.email
  state jsonb not null default '{}'::jsonb,  -- 完整 state（done/notes/drafts/gameProgress/...）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) 行级安全：仅本人可读写
alter table public.codepath_progress enable row level security;

drop policy if exists "codepath_progress_select" on public.codepath_progress;
create policy "codepath_progress_select" on public.codepath_progress
  for select using (auth.uid() is not null and owner_email = auth.jwt()->>'email');

drop policy if exists "codepath_progress_insert" on public.codepath_progress;
create policy "codepath_progress_insert" on public.codepath_progress
  for insert with check (auth.uid() is not null and owner_email = auth.jwt()->>'email');

drop policy if exists "codepath_progress_update" on public.codepath_progress;
create policy "codepath_progress_update" on public.codepath_progress
  for update using (auth.uid() is not null and owner_email = auth.jwt()->>'email');

-- 3) anon key 允许注册/登录（REST 客户端用 anon + Bearer user token 访问 PostgREST）
--    无需额外授权配置；PostgREST 默认暴露 public schema 表。

-- 4) 验证查询
select owner_email, jsonb_object_keys(state) as state_key, updated_at
from public.codepath_progress
order by updated_at desc
limit 5;
