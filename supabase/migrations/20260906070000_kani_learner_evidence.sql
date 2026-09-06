-- Kani authenticated learner persistence schema.
-- Architecture decision: Study-Hub #15. Implementation epic: Study-Hub #18.
-- The browser remains local-first. Authenticated remote writes are performed only
-- through the versioned Edge Function API; direct authenticated table writes are revoked.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create table if not exists public.kani_households (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kani_household_members (
  household_id uuid not null references public.kani_households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'guardian' check (role in ('guardian', 'admin')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index if not exists kani_household_members_user_idx
  on public.kani_household_members(user_id, household_id);

create table if not exists public.kani_students (
  household_id uuid not null references public.kani_households(id) on delete cascade,
  id text not null check (length(btrim(id)) between 1 and 160),
  name text not null check (length(btrim(name)) between 1 and 120),
  avatar text not null default '🧑‍🚀' check (length(avatar) <= 32),
  grade text not null default 'Grade 4' check (length(btrim(grade)) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (household_id, id)
);

create table if not exists public.kani_attempts (
  household_id uuid not null,
  attempt_id text not null check (length(btrim(attempt_id)) between 1 and 200),
  student_id text not null,
  schema_version text not null check (length(btrim(schema_version)) between 1 and 32),
  activity_id text not null check (length(btrim(activity_id)) between 1 and 240),
  activity_type text not null check (activity_type in ('lesson', 'worksheet', 'quiz', 'game', 'brain', 'challenge', 'interactive')),
  source_app text not null check (source_app in ('study-hub', 'game-app', 'worksheet-app')),
  subject_id text,
  topic_id text,
  page_id text,
  question_id text,
  round_id text,
  skill_ids text[] not null default '{}',
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'mixed', 'none')),
  correct boolean,
  partial_credit numeric check (partial_credit is null or (partial_credit >= 0 and partial_credit <= 1)),
  response_time_ms bigint check (response_time_ms is null or response_time_ms >= 0),
  hints_used integer check (hints_used is null or hints_used >= 0),
  score numeric,
  started_at timestamptz,
  completed_at timestamptz not null,
  received_at timestamptz not null default now(),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  primary key (household_id, attempt_id),
  foreign key (household_id, student_id)
    references public.kani_students(household_id, id)
    on delete cascade,
  check (payload ->> 'attemptId' = attempt_id),
  check (payload ->> 'studentId' = student_id),
  check (payload ->> 'schemaVersion' = schema_version),
  check (payload ->> 'activityId' = activity_id)
);

create index if not exists kani_attempts_student_completed_idx
  on public.kani_attempts(household_id, student_id, completed_at desc);
create index if not exists kani_attempts_activity_idx
  on public.kani_attempts(household_id, student_id, activity_id, completed_at desc);
create index if not exists kani_attempts_topic_idx
  on public.kani_attempts(household_id, student_id, topic_id, completed_at desc)
  where topic_id is not null;
create index if not exists kani_attempts_question_idx
  on public.kani_attempts(household_id, student_id, question_id, completed_at desc)
  where question_id is not null;
create index if not exists kani_attempts_skill_ids_gin_idx
  on public.kani_attempts using gin(skill_ids);

-- Avoid recursive RLS lookups through household_members. This helper lives in an
-- unexposed schema and returns only a membership boolean for the current JWT user.
create or replace function private.kani_is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.kani_household_members membership
    where membership.household_id = target_household_id
      and membership.user_id = (select auth.uid())
  );
$$;

-- Attempts are immutable events. Account/household deletion may still cascade-delete
-- them through foreign keys, but no code path should rewrite submitted evidence.
create or replace function private.kani_reject_attempt_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  raise exception 'Kani attempt evidence is immutable; insert a new attempt event instead.'
    using errcode = '55000';
end;
$$;

drop trigger if exists kani_attempts_immutable on public.kani_attempts;
create trigger kani_attempts_immutable
before update on public.kani_attempts
for each row execute function private.kani_reject_attempt_update();

alter table public.kani_households enable row level security;
alter table public.kani_household_members enable row level security;
alter table public.kani_students enable row level security;
alter table public.kani_attempts enable row level security;

create policy "Kani members can read their household"
  on public.kani_households
  for select
  to authenticated
  using ((select private.kani_is_household_member(id)));

create policy "Kani members can read household membership"
  on public.kani_household_members
  for select
  to authenticated
  using ((select private.kani_is_household_member(household_id)));

create policy "Kani members can read household students"
  on public.kani_students
  for select
  to authenticated
  using ((select private.kani_is_household_member(household_id)));

create policy "Kani members can read household attempts"
  on public.kani_attempts
  for select
  to authenticated
  using ((select private.kani_is_household_member(household_id)));

-- Data API permissions are intentionally read-only for authenticated browser users.
-- The Edge Function API validates/authenticates writes and uses its server secret.
revoke all on public.kani_households from anon;
revoke all on public.kani_household_members from anon;
revoke all on public.kani_students from anon;
revoke all on public.kani_attempts from anon;

revoke insert, update, delete, truncate, references, trigger on public.kani_households from authenticated;
revoke insert, update, delete, truncate, references, trigger on public.kani_household_members from authenticated;
revoke insert, update, delete, truncate, references, trigger on public.kani_students from authenticated;
revoke insert, update, delete, truncate, references, trigger on public.kani_attempts from authenticated;

grant select on public.kani_households to authenticated;
grant select on public.kani_household_members to authenticated;
grant select on public.kani_students to authenticated;
grant select on public.kani_attempts to authenticated;

grant all on public.kani_households to service_role;
grant all on public.kani_household_members to service_role;
grant all on public.kani_students to service_role;
grant all on public.kani_attempts to service_role;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;
revoke all on function private.kani_is_household_member(uuid) from public;
grant execute on function private.kani_is_household_member(uuid) to authenticated, service_role;
revoke all on function private.kani_reject_attempt_update() from public;
grant execute on function private.kani_reject_attempt_update() to service_role;

comment on table public.kani_attempts is
  'Append-oriented, validated kani-attempt-v1 evidence. payload preserves the versioned contract; indexed columns support queries.';
comment on column public.kani_attempts.payload is
  'Validated kani-attempt-v1 JSON. Must agree with indexed identity fields via CHECK constraints.';
