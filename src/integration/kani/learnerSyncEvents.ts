export const KANI_ATTEMPT_QUEUED_EVENT = 'kani:attempt-queued';

/**
 * Notify the optional browser sync bootstrap that new outbox evidence exists.
 * Core persistence remains DOM-neutral: callers explicitly opt into this signal.
 */
export function signalAttemptQueued(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(KANI_ATTEMPT_QUEUED_EVENT));
}
