import { KaniAttemptV1 } from './contracts';
import { canonicalJson } from './canonicalJson';
import { assertKaniAttempt } from './validators';

export interface AttemptHistoryConflict {
  attemptId: string;
  local: KaniAttemptV1;
  remote: KaniAttemptV1;
}

export interface MergedAttemptHistory {
  attempts: KaniAttemptV1[];
  conflicts: AttemptHistoryConflict[];
}

function newestFirst(attempts: readonly KaniAttemptV1[]): KaniAttemptV1[] {
  return [...attempts].sort((a, b) => {
    const timeDelta = Date.parse(b.completedAt) - Date.parse(a.completedAt);
    return timeDelta !== 0 ? timeDelta : a.attemptId.localeCompare(b.attemptId);
  });
}

/**
 * Merge local-first and remote canonical histories by immutable attemptId.
 *
 * Identical replays collapse to one event. If an impossible immutable-ID
 * conflict is observed, the local event remains visible to the learner and the
 * conflict is surfaced separately for diagnostics rather than silently picking
 * the remote payload.
 */
export function mergeAttemptHistory(
  localAttempts: readonly KaniAttemptV1[],
  remoteAttempts: readonly KaniAttemptV1[],
): MergedAttemptHistory {
  const byId = new Map<string, KaniAttemptV1>();
  const conflicts: AttemptHistoryConflict[] = [];

  for (const attempt of localAttempts) {
    assertKaniAttempt(attempt);
    const existing = byId.get(attempt.attemptId);
    if (!existing) {
      byId.set(attempt.attemptId, attempt);
      continue;
    }
    if (canonicalJson(existing) !== canonicalJson(attempt)) {
      // Duplicate conflicts inside the local source are also abnormal. Preserve
      // the first event because LocalAttemptStore now enforces immutability.
      conflicts.push({ attemptId: attempt.attemptId, local: existing, remote: attempt });
    }
  }

  for (const remote of remoteAttempts) {
    assertKaniAttempt(remote);
    const local = byId.get(remote.attemptId);
    if (!local) {
      byId.set(remote.attemptId, remote);
      continue;
    }
    if (canonicalJson(local) !== canonicalJson(remote)) {
      conflicts.push({ attemptId: remote.attemptId, local, remote });
    }
  }

  return {
    attempts: newestFirst([...byId.values()]),
    conflicts,
  };
}
