-- Quantax Investor Deck V2 selective access
-- Run once in Supabase SQL Editor for the ZRC platform project.

create table if not exists public.deck_v2_allowlist (
  email text primary key,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

alter table public.deck_v2_allowlist enable row level security;

-- No direct anonymous reads/writes to the allowlist.
revoke all on table public.deck_v2_allowlist from anon, authenticated;

create or replace function public.authorize_quantax_v2(
  p_email text,
  p_user_agent text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_allowed boolean := false;
begin
  select exists (
    select 1
    from public.deck_v2_allowlist
    where lower(email) = v_email
      and active = true
  ) into v_allowed;

  if v_allowed then
    insert into public.deck_access_leads (email, deck_id, source, user_agent)
    values (v_email, 'quantax_investor_deck_v2', 'netlify_selective_valuation_deck', p_user_agent);
  end if;

  return v_allowed;
end;
$$;

revoke all on function public.authorize_quantax_v2(text, text) from public;
grant execute on function public.authorize_quantax_v2(text, text) to anon;

-- Read-only allowlist check used by the Netlify function that serves the
-- protected round slide. Unlike authorize_quantax_v2 it records no lead, so it
-- can run on every image request. Granted to service_role only: the browser
-- never calls it, which keeps the allowlist un-enumerable from the client.
create or replace function public.is_quantax_v2_allowed(p_email text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.deck_v2_allowlist
    where lower(email) = lower(trim(p_email))
      and active = true
  );
$$;

revoke all on function public.is_quantax_v2_allowed(text) from public, anon, authenticated;
grant execute on function public.is_quantax_v2_allowed(text) to service_role;

-- Example: authorize a specific investor email
-- insert into public.deck_v2_allowlist (email, note)
-- values ('investor@example.com', 'Investor name / firm')
-- on conflict (email) do update set active = true, note = excluded.note;

-- Revoke access later with:
-- update public.deck_v2_allowlist set active = false where email = 'investor@example.com';
