import React, { useEffect } from 'react';
import { AttemptSyncCoordinator } from '../../integration/kani/AttemptSyncCoordinator';
import { LocalAttemptSyncQueue } from '../../integration/kani/AttemptSyncQueue';
import { LearnerApiClient } from '../../integration/kani/LearnerApiClient';
import { SupabaseGuardianAuth } from '../../integration/kani/SupabaseGuardianAuth';
import { getLearnerSyncConfig } from '../../integration/kani/learnerSyncConfig';
import { KANI_ATTEMPT_QUEUED_EVENT } from '../../integration/kani/learnerSyncEvents';

const RETRY_TICK_MS = 60_000;
const MIN_FLUSH_SPACING_MS = 1_000;

/**
 * App-wide, feature-gated local-first sync bootstrap. It never blocks learner UI:
 * writes have already landed locally before this component attempts network work.
 * With sync disabled (the production default today) it installs no listeners and
 * performs no authentication or network calls.
 */
export const LearnerSyncBootstrap: React.FC = () => {
  useEffect(() => {
    const config = getLearnerSyncConfig();
    if (!config.ready) return;

    const auth = new SupabaseGuardianAuth({
      supabaseUrl: config.supabaseUrl,
      publishableKey: config.supabasePublishableKey,
    });
    const api = new LearnerApiClient({
      baseUrl: config.apiBaseUrl,
      sessionProvider: auth,
      publishableKey: config.supabasePublishableKey,
      householdIdProvider: () => config.householdId || null,
    });
    const queue = new LocalAttemptSyncQueue();
    const coordinator = new AttemptSyncCoordinator(queue, api);

    let disposed = false;
    let inFlight: Promise<void> | null = null;
    let lastFlushStartedAt = 0;
    let delayedTimer: ReturnType<typeof setTimeout> | null = null;

    const browserOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

    const flush = () => {
      if (disposed || !browserOnline() || queue.counts().total === 0) return;
      if (inFlight) return;

      const now = Date.now();
      const waitMs = Math.max(0, MIN_FLUSH_SPACING_MS - (now - lastFlushStartedAt));
      if (waitMs > 0) {
        if (delayedTimer) return;
        delayedTimer = setTimeout(() => {
          delayedTimer = null;
          flush();
        }, waitMs);
        return;
      }

      lastFlushStartedAt = now;
      inFlight = coordinator.flush()
        .then((result) => {
          if (result.blocked > 0) {
            console.warn(`${result.blocked} learner attempt${result.blocked === 1 ? '' : 's'} could not be synced and require attention (${result.reason || 'blocked'}).`);
          }
        })
        .catch((error) => {
          // Coordinator normally converts network/auth failures into deferred
          // queue state. This is a final safety net; never surface as learner UI.
          console.warn('Learner sync runtime could not complete a background flush.', error);
        })
        .finally(() => {
          inFlight = null;
        });
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') flush();
    };
    const onQueued = () => flush();
    const onOnline = () => flush();
    const onFocus = () => flush();

    window.addEventListener(KANI_ATTEMPT_QUEUED_EVENT, onQueued);
    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    // Resume an outbox left by an earlier offline/reload period as soon as this
    // configured app starts. Auth/profile-link errors remain deferred unchanged.
    const initialTimer = setTimeout(flush, 0);
    const retryTimer = setInterval(() => {
      if (queue.counts().total > 0) flush();
    }, RETRY_TICK_MS);

    return () => {
      disposed = true;
      clearTimeout(initialTimer);
      clearInterval(retryTimer);
      if (delayedTimer) clearTimeout(delayedTimer);
      window.removeEventListener(KANI_ATTEMPT_QUEUED_EVENT, onQueued);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
};
