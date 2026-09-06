begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

select has_table('public', 'kani_households', 'households table exists');
select has_table('public', 'kani_household_members', 'household membership table exists');
select has_table('public', 'kani_students', 'students table exists');
select has_table('public', 'kani_attempts', 'attempt evidence table exists');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.kani_households'::regclass),
  'RLS is enabled on households'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.kani_household_members'::regclass),
  'RLS is enabled on household members'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.kani_students'::regclass),
  'RLS is enabled on students'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.kani_attempts'::regclass),
  'RLS is enabled on attempts'
);

select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'kani_households' and policyname = 'Kani members can read their household' and cmd = 'SELECT'),
  'household read policy exists'
);
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'kani_household_members' and policyname = 'Kani members can read household membership' and cmd = 'SELECT'),
  'membership read policy exists'
);
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'kani_students' and policyname = 'Kani members can read household students' and cmd = 'SELECT'),
  'student read policy exists'
);
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'kani_attempts' and policyname = 'Kani members can read household attempts' and cmd = 'SELECT'),
  'attempt read policy exists'
);

-- Fixed UUIDs make failures reproducible and avoid depending on generated IDs.
insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'guardian-a@example.test'),
  ('20000000-0000-0000-0000-000000000002', 'guardian-b@example.test');

insert into public.kani_households (id)
values
  ('aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-000000000002');

insert into public.kani_household_members (household_id, user_id, role)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'guardian'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'guardian');

insert into public.kani_students (household_id, id, name, avatar, grade)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'student_same_1000', 'Same Name', '🦊', 'Grade 4'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'student_same_1000', 'Same Name', '🐼', 'Grade 4');

insert into public.kani_attempts (
  household_id, attempt_id, student_id, schema_version, activity_id, activity_type,
  source_app, subject_id, topic_id, page_id, question_id, skill_ids, difficulty,
  correct, partial_credit, completed_at, payload
)
values
  (
    'aaaaaaaa-0000-0000-0000-000000000001', 'attempt-a-1', 'student_same_1000', '1.0',
    'studyhub:grade4math-number-system-practice', 'worksheet', 'study-hub', 'grade4math',
    'grade4math-number-system', 'grade4math-number-system-practice', 'grade4math-number-system-q01',
    array['skill-expanded-form'], 'easy', false, 0,
    '2026-09-06T06:00:00Z',
    '{"schemaVersion":"1.0","attemptId":"attempt-a-1","studentId":"student_same_1000","activityId":"studyhub:grade4math-number-system-practice","activityType":"worksheet","sourceApp":"study-hub","subjectId":"grade4math","topicId":"grade4math-number-system","pageId":"grade4math-number-system-practice","questionId":"grade4math-number-system-q01","skillIds":["skill-expanded-form"],"difficulty":"easy","correct":false,"partialCredit":0,"completedAt":"2026-09-06T06:00:00Z"}'::jsonb
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000002', 'attempt-b-1', 'student_same_1000', '1.0',
    'studyhub:grade4math-number-system-practice', 'worksheet', 'study-hub', 'grade4math',
    'grade4math-number-system', 'grade4math-number-system-practice', 'grade4math-number-system-q02',
    array['skill-expanded-form'], 'easy', true, 1,
    '2026-09-06T06:01:00Z',
    '{"schemaVersion":"1.0","attemptId":"attempt-b-1","studentId":"student_same_1000","activityId":"studyhub:grade4math-number-system-practice","activityType":"worksheet","sourceApp":"study-hub","subjectId":"grade4math","topicId":"grade4math-number-system","pageId":"grade4math-number-system-practice","questionId":"grade4math-number-system-q02","skillIds":["skill-expanded-form"],"difficulty":"easy","correct":true,"partialCredit":1,"completedAt":"2026-09-06T06:01:00Z"}'::jsonb
  );

set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000001';

select is((select count(*) from public.kani_households), 1::bigint, 'guardian reads only their household');
select is((select count(*) from public.kani_students), 1::bigint, 'guardian reads only their household student even when display names/ids match another household');
select is((select count(*) from public.kani_attempts), 1::bigint, 'guardian reads only their household attempts');
select is((select attempt_id from public.kani_attempts limit 1), 'attempt-a-1', 'guardian cannot see the other household attempt');

set local "request.jwt.claim.sub" = '30000000-0000-0000-0000-000000000003';

select is((select count(*) from public.kani_households), 0::bigint, 'non-member reads no households');
select is((select count(*) from public.kani_students), 0::bigint, 'non-member reads no students');
select is((select count(*) from public.kani_attempts), 0::bigint, 'non-member reads no attempts');

set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000001';

select throws_ok(
  $$insert into public.kani_students (household_id, id, name) values ('aaaaaaaa-0000-0000-0000-000000000001', 'browser-write', 'Browser Write')$$,
  '42501',
  'permission denied for table kani_students',
  'authenticated browser role cannot insert students directly'
);
select throws_ok(
  $$insert into public.kani_attempts (household_id, attempt_id, student_id, schema_version, activity_id, activity_type, source_app, skill_ids, difficulty, completed_at, payload) values ('aaaaaaaa-0000-0000-0000-000000000001', 'browser-attempt', 'student_same_1000', '1.0', 'browser:test', 'quiz', 'game-app', '{}', 'easy', now(), '{"schemaVersion":"1.0","attemptId":"browser-attempt","studentId":"student_same_1000","activityId":"browser:test"}'::jsonb)$$,
  '42501',
  'permission denied for table kani_attempts',
  'authenticated browser role cannot insert attempts directly'
);

reset role;

select throws_ok(
  $$update public.kani_attempts set score = 99 where household_id = 'aaaaaaaa-0000-0000-0000-000000000001' and attempt_id = 'attempt-a-1'$$,
  '55000',
  'Kani attempt evidence is immutable; insert a new attempt event instead.',
  'privileged write path cannot mutate an existing attempt event'
);

select * from finish();
rollback;
