-- Atomic write quota for the authenticated Edge Function API.
-- This is a coarse abuse-control guard, not a billing meter. The Edge Function
-- still enforces request-byte and batch-size limits before calling this RPC.

create table if not exists private.kani_api_rate_limits (
  user_id uuid not null,
  window_start timestamptz not null,
  write_units integer not null check (write_units >= 0),
  primary key (user_id, window_start)
);

revoke all on private.kani_api_rate_limits from public, anon, authenticated;

create or replace function public.kani_consume_api_write_quota(
  p_user_id uuid,
  p_cost integer,
  p_limit integer default 120
)
returns table (
  allowed boolean,
  used integer,
  quota_limit integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  current_window timestamptz := date_trunc('minute', clock_timestamp());
  next_used integer;
begin
  if p_user_id is null then
    raise exception 'Verified user id is required' using errcode = '22023';
  end if;
  if p_cost < 1 or p_cost > 100 then
    raise exception 'Quota cost must be between 1 and 100' using errcode = '22023';
  end if;
  if p_limit < 1 or p_limit > 10000 then
    raise exception 'Quota limit must be between 1 and 10000' using errcode = '22023';
  end if;

  insert into private.kani_api_rate_limits (user_id, window_start, write_units)
  values (p_user_id, current_window, p_cost)
  on conflict (user_id, window_start)
  do update set write_units = private.kani_api_rate_limits.write_units + excluded.write_units
  returning write_units into next_used;

  return query
  select
    next_used <= p_limit,
    next_used,
    p_limit,
    greatest(1, 60 - extract(second from clock_timestamp())::integer);
end;
$$;

revoke all on function public.kani_consume_api_write_quota(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.kani_consume_api_write_quota(uuid, integer, integer) to service_role;

comment on function public.kani_consume_api_write_quota(uuid, integer, integer) is
  'Service-role-only atomic write quota used by the authenticated Kani Edge Function API.';
