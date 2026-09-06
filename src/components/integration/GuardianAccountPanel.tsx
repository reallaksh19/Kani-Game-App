import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { AttemptSyncCoordinator } from '../../integration/kani/AttemptSyncCoordinator';
import { LocalAttemptSyncQueue } from '../../integration/kani/AttemptSyncQueue';
import { LearnerApiClient } from '../../integration/kani/LearnerApiClient';
import { StudentProfileSyncPlan, importLocalStudentProfiles, planStudentProfileSync } from '../../integration/kani/StudentProfileSync';
import { GuardianAccount, GuardianAuthError, SupabaseGuardianAuth } from '../../integration/kani/SupabaseGuardianAuth';
import { getLearnerSyncConfig } from '../../integration/kani/learnerSyncConfig';

const emptyPlan: StudentProfileSyncPlan = {
  imports: [],
  alreadyLinked: [],
  remoteOnly: [],
  conflicts: [],
};

export const GuardianAccountPanel: React.FC = () => {
  const { studentProfiles } = useAppContext();
  const config = useMemo(() => getLearnerSyncConfig(), []);
  const auth = useMemo(() => config.authReady ? new SupabaseGuardianAuth({
    supabaseUrl: config.supabaseUrl,
    publishableKey: config.supabasePublishableKey,
  }) : null, [config.authReady, config.supabasePublishableKey, config.supabaseUrl]);
  const api = useMemo(() => auth && config.apiReady ? new LearnerApiClient({
    baseUrl: config.apiBaseUrl,
    sessionProvider: auth,
    publishableKey: config.supabasePublishableKey,
  }) : null, [auth, config.apiBaseUrl, config.apiReady, config.supabasePublishableKey]);
  const queue = useMemo(() => new LocalAttemptSyncQueue(), []);

  const [account, setAccount] = useState<GuardianAccount | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<StudentProfileSyncPlan>(emptyPlan);
  const [queueCounts, setQueueCounts] = useState(() => queue.counts());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const refreshRemoteState = async () => {
    if (!api) return;
    const remote = await api.listStudents();
    setPlan(planStudentProfileSync(studentProfiles, remote));
    setQueueCounts(queue.counts());
  };

  useEffect(() => {
    let cancelled = false;
    if (!auth) return;
    auth.getAccount().then(async (current) => {
      if (cancelled) return;
      setAccount(current);
      if (current && api) {
        try {
          const remote = await api.listStudents();
          if (!cancelled) setPlan(planStudentProfileSync(studentProfiles, remote));
        } catch {
          // Account remains valid; remote status can be retried explicitly.
        }
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [api, auth, studentProfiles]);

  if (!config.requested) {
    return (
      <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-400">
        Guardian cloud sync is disabled for this build. Local learner data remains fully available.
      </div>
    );
  }

  if (!config.ready || !auth || !api) {
    return (
      <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-100">
        <div className="font-bold">Guardian cloud sync is not ready</div>
        <div className="mt-1 text-xs text-amber-200/80">{config.reason || 'Public API/auth configuration is incomplete.'}</div>
      </div>
    );
  }

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const next = await auth.signIn(email, password);
      setAccount(next);
      setPassword('');
      await refreshRemoteState();
      setMessage('Signed in. Local learning still works offline; cloud sync is optional.');
    } catch (cause) {
      setError(cause instanceof GuardianAuthError ? cause.message : cause instanceof Error ? cause.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    await auth.signOut();
    setAccount(null);
    setPlan(emptyPlan);
    setPassword('');
    setMessage('Signed out on this device. Local learner data was not removed.');
    setBusy(false);
  };

  const linkLocalProfiles = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await importLocalStudentProfiles(api, studentProfiles);
      if (result.conflicts.length > 0) {
        setPlan({
          imports: [],
          alreadyLinked: result.alreadyLinked,
          remoteOnly: result.remoteOnly,
          conflicts: result.conflicts,
        });
        setError('Profile ID conflict detected. Nothing was overwritten; resolve the conflict before importing.');
      } else {
        await refreshRemoteState();
        setMessage(`${result.imported.length} local profile${result.imported.length === 1 ? '' : 's'} linked to this household.`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Student profiles could not be linked.');
    } finally {
      setBusy(false);
    }
  };

  const syncPending = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const coordinator = new AttemptSyncCoordinator(queue, api);
      const result = await coordinator.flush();
      setQueueCounts(queue.counts());
      if (result.synced > 0) setMessage(`${result.synced} queued attempt${result.synced === 1 ? '' : 's'} synced.`);
      else if (result.reason) setError(`Sync deferred: ${result.reason}. Local evidence is unchanged.`);
      else setMessage('No queued attempts are ready to sync.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Queued attempts could not be synced.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/15 p-4 text-sm text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-bold text-cyan-100">☁️ Guardian account / learner sync</div>
          <div className="mt-1 text-xs text-slate-400">Optional adult account. Children still use stable Kani student IDs and do not need credentials.</div>
        </div>
        {account && <span className="rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-xs text-emerald-200">Signed in</span>}
      </div>

      {!account ? (
        <form onSubmit={signIn} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Guardian email"
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-white"
          />
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-white"
          />
          <button disabled={busy} className="rounded-lg bg-cyan-600 px-4 py-2 font-bold text-white disabled:opacity-50">Sign in</button>
        </form>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Guardian</div>
            <div className="mt-1 font-medium">{account.email}</div>
          </div>

          <div className="grid gap-2 sm:grid-cols-4">
            <Metric label="Local to link" value={plan.imports.length} />
            <Metric label="Already linked" value={plan.alreadyLinked.length} />
            <Metric label="Remote only" value={plan.remoteOnly.length} />
            <Metric label="Conflicts" value={plan.conflicts.length} />
          </div>

          {plan.conflicts.length > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-200">
              Conflicting stable IDs: {plan.conflicts.map((item) => item.studentId).join(', ')}. Kani will not merge or overwrite these automatically.
            </div>
          )}
          {plan.remoteOnly.length > 0 && (
            <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-3 text-xs text-sky-200">
              Remote-only students available on this household: {plan.remoteOnly.map((item) => `${item.avatar} ${item.name} (${item.id})`).join(' · ')}. Explicit second-device local import remains a separate action; nothing is auto-created on this device.
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={linkLocalProfiles} disabled={busy || plan.imports.length === 0 || plan.conflicts.length > 0} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Link local profiles</button>
            <button type="button" onClick={syncPending} disabled={busy || queueCounts.total === 0} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Sync queued attempts ({queueCounts.total})</button>
            <button type="button" onClick={refreshRemoteState} disabled={busy} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Refresh</button>
            <button type="button" onClick={signOut} disabled={busy} className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-40">Sign out</button>
          </div>
        </div>
      )}

      {message && <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2 text-xs text-emerald-200">{message}</div>}
      {error && <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-950/20 p-2 text-xs text-rose-200">{error}</div>}
      <div className="mt-3 text-[11px] text-slate-500">Passwords are never stored by Kani. Browser storage contains only the Supabase session needed to resume an authenticated guardian account.</div>
    </section>
  );
};

const Metric: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-2 text-center">
    <div className="text-lg font-bold text-white">{value}</div>
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
  </div>
);
