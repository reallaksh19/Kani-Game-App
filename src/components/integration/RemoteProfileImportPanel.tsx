import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { LearnerApiClient, RemoteStudentProfile } from '../../integration/kani/LearnerApiClient';
import { importRemoteProfilesLocally, planRemoteProfilesForLocalImport } from '../../integration/kani/RemoteStudentProfileImport';
import { SupabaseGuardianAuth } from '../../integration/kani/SupabaseGuardianAuth';
import { getLearnerSyncConfig } from '../../integration/kani/learnerSyncConfig';

/**
 * Explicit second-device profile adoption. This is intentionally separate from
 * automatic attempt synchronization: no remote learner profile is created on the
 * device until the signed-in guardian chooses to import it.
 */
export const RemoteProfileImportPanel: React.FC = () => {
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
    householdIdProvider: () => config.householdId || null,
  }) : null, [auth, config.apiBaseUrl, config.apiReady, config.householdId, config.supabasePublishableKey]);

  const [remote, setRemote] = useState<RemoteStudentProfile[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reloadRequired, setReloadRequired] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const plan = useMemo(() => planRemoteProfilesForLocalImport(studentProfiles, remote), [remote, studentProfiles]);

  useEffect(() => {
    let cancelled = false;
    if (!auth || !api || !config.ready) return;
    auth.getSession().then(async (session) => {
      if (cancelled || !session) return;
      setSignedIn(true);
      try {
        const profiles = await api.listStudents();
        if (!cancelled) setRemote(profiles);
      } catch {
        // Account panel exposes refresh/error controls; this optional import panel
        // stays quiet until the remote list is available.
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [api, auth, config.ready]);

  if (!config.ready || !signedIn) return null;

  const refresh = async () => {
    if (!api) return;
    setLoading(true);
    setError('');
    try {
      setRemote(await api.listStudents());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Remote profiles could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const importProfiles = async () => {
    if (plan.importable.length === 0) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await importRemoteProfilesLocally(studentProfiles, plan.importable);
      if (result.conflicts.length > 0) {
        setError(`Stable-ID conflict: ${result.conflicts.map((item) => item.studentId).join(', ')}. Nothing was overwritten.`);
      } else if (result.wrote) {
        setReloadRequired(true);
        setMessage(`${result.imported.length} remote profile${result.imported.length === 1 ? '' : 's'} imported on this device. Reload Kani to activate the updated profile list.`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Remote profiles could not be imported locally.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-violet-500/30 bg-violet-950/15 p-4 text-sm text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-bold text-violet-100">📥 Second-device student profiles</div>
          <div className="mt-1 text-xs text-slate-400">Remote profiles are never auto-created locally. Import is an explicit guardian action keyed by stable student ID.</div>
        </div>
        <button type="button" onClick={refresh} disabled={loading} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Refresh</button>
      </div>

      {plan.conflicts.length > 0 && (
        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-200">
          Conflicting stable IDs: {plan.conflicts.map((item) => item.studentId).join(', ')}. These cannot be imported automatically.
        </div>
      )}

      {plan.importable.length > 0 ? (
        <div className="mt-3">
          <div className="space-y-2">
            {plan.importable.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                <div className="min-w-0">
                  <div className="font-medium text-white">{profile.avatar} {profile.name}</div>
                  <div className="mt-1 break-all font-mono text-[10px] text-slate-500">{profile.id}</div>
                </div>
                <div className="text-xs text-slate-400">{profile.grade}</div>
              </div>
            ))}
          </div>
          <button type="button" onClick={importProfiles} disabled={loading || plan.conflicts.length > 0 || reloadRequired} className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">
            Import {plan.importable.length} profile{plan.importable.length === 1 ? '' : 's'} on this device
          </button>
        </div>
      ) : (
        <div className="mt-3 text-xs text-slate-400">No remote-only student profiles are waiting to be imported on this device.</div>
      )}

      {reloadRequired && (
        <button type="button" onClick={() => window.location.reload()} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
          Reload Kani now
        </button>
      )}
      {message && <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2 text-xs text-emerald-200">{message}</div>}
      {error && <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-950/20 p-2 text-xs text-rose-200">{error}</div>}
    </section>
  );
};
