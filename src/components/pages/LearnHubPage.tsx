import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { KaniCatalogTopic, KaniCatalogV1, StudyHubPageDocument } from '../../integration/kani/contracts';
import { resolveStudyHubLearnerUrl, StudyHubContentClient } from '../../integration/kani/StudyHubContentClient';
import { getKaniIntegrationConfig } from '../../integration/kani/integrationConfig';
import { scopeKaniCatalog } from '../../integration/kani/catalogScope';
import { LocalAttemptStore } from '../../integration/kani/AttemptStore';
import { useAppContext } from '../../contexts/AppContext';
import {
  derivePageRevisionSignals,
  getSuggestedReviewPages,
  PageRevisionSignal,
  revisionSignalLabel,
} from '../../utils/canonicalRevisionSignals';
import { StudyHubPracticePanel } from '../integration/StudyHubPracticePanel';

interface LearnHubPageProps {
  onBack: () => void;
}

export const LearnHubPage: React.FC<LearnHubPageProps> = ({ onBack }) => {
  const { activeStudent } = useAppContext();
  const config = useMemo(() => getKaniIntegrationConfig(), []);
  const client = useMemo(() => new StudyHubContentClient({
    baseUrl: config.studyHubBaseUrl,
    catalogPath: config.studyHubCatalogPath,
  }), [config.studyHubBaseUrl, config.studyHubCatalogPath]);
  const attemptStore = useMemo(() => new LocalAttemptStore(), []);
  const [catalog, setCatalog] = useState<KaniCatalogV1 | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<StudyHubPageDocument | null>(null);
  const [loadingPageId, setLoadingPageId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [pageSignals, setPageSignals] = useState<Map<string, PageRevisionSignal>>(new Map());
  const [evidenceError, setEvidenceError] = useState('');

  const rolloutScoped = config.allowedStudyHubSubjectIds.length > 0 || config.allowedStudyHubGrades.length > 0;

  const loadCatalog = async () => {
    setStatus('loading');
    setError('');
    setSelectedPage(null);
    try {
      client.clearCache();
      const published = await client.getCatalog();
      const next = scopeKaniCatalog(published, {
        subjectIds: config.allowedStudyHubSubjectIds,
        grades: config.allowedStudyHubGrades,
      });
      setCatalog(next);
      setSelectedTopicId((current) => current && next.topics.some((topic) => topic.id === current) ? current : next.topics[0]?.id || null);
      setStatus('ready');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Study-Hub catalog could not be loaded.');
    }
  };

  const loadEvidence = useCallback(async () => {
    if (!activeStudent) {
      setPageSignals(new Map());
      setEvidenceError('');
      return;
    }
    try {
      const attempts = await attemptStore.listAttempts(activeStudent.id);
      setPageSignals(derivePageRevisionSignals(attempts));
      setEvidenceError('');
    } catch {
      setPageSignals(new Map());
      setEvidenceError('Recent practice evidence could not be loaded. Learn content is still available.');
    }
  }, [activeStudent, attemptStore]);

  useEffect(() => {
    void loadCatalog();
    // The integration client/config are stable for this page lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  useEffect(() => {
    void loadEvidence();
  }, [loadEvidence]);

  const selectedTopic: KaniCatalogTopic | undefined = catalog?.topics.find((topic) => topic.id === selectedTopicId);
  const pages = catalog?.pages.filter((page) => page.topicId === selectedTopicId) || [];
  const subjectById = new Map((catalog?.subjects || []).map((subject) => [subject.id, subject]));
  const selectedPageMeta = selectedPage ? catalog?.pages.find((page) => page.id === selectedPage.id) : undefined;
  const selectedPageSignal = selectedPageMeta ? pageSignals.get(selectedPageMeta.id) : undefined;
  const selectedLearnerUrl = selectedPageMeta?.learnerUrl
    ? resolveStudyHubLearnerUrl(config.studyHubBaseUrl, selectedPageMeta.learnerUrl)
    : null;
  const suggestedReview = useMemo(
    () => catalog ? getSuggestedReviewPages(pageSignals, catalog.pages.map((page) => page.id), 3) : [],
    [catalog, pageSignals],
  );

  const openPage = async (pageId: string) => {
    setLoadingPageId(pageId);
    setError('');
    try {
      setSelectedPage(await client.getPage(pageId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Page could not be loaded.');
    } finally {
      setLoadingPageId(null);
    }
  };

  const openSuggestedPage = (pageId: string) => {
    const page = catalog?.pages.find((entry) => entry.id === pageId);
    if (page) setSelectedTopicId(page.topicId);
    void openPage(pageId);
  };

  return (
    <SpaceBackground>
      <div className="min-h-full overflow-y-auto px-4 py-6 text-white">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={onBack} aria-label="Back to home" className="h-11 w-11 rounded-full bg-slate-900/80 text-xl hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400">←</button>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Study-Hub · Content Plane</div>
                <h1 className="text-3xl font-black sm:text-4xl">📚 Learn</h1>
                <p className="mt-1 text-sm text-slate-300">Discover Study-Hub lessons, then practice them through Kani.</p>
              </div>
            </div>
            <button onClick={() => void loadCatalog()} className="rounded-full border border-cyan-300/30 bg-cyan-950/40 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-900/50">↻ Refresh catalog</button>
          </div>

          {!config.integrationLearnEnabled && (
            <div className="mb-5 rounded-2xl border border-amber-400/40 bg-amber-950/40 p-4 text-amber-100">
              Learn integration is disabled by feature flag. This route is an integration diagnostic placeholder and should not be exposed in normal navigation until enabled.
            </div>
          )}

          {rolloutScoped && (
            <div className="mb-5 rounded-2xl border border-cyan-300/30 bg-cyan-950/35 p-4 text-sm text-cyan-50">
              <div className="font-bold">Controlled Learn rollout scope</div>
              <div className="mt-1 text-cyan-100/80">
                Subjects: {config.allowedStudyHubSubjectIds.join(', ') || 'all'} · Grades: {config.allowedStudyHubGrades.join(', ') || 'all'}
              </div>
            </div>
          )}

          {evidenceError && (
            <div className="mb-5 rounded-2xl border border-amber-300/25 bg-amber-950/25 p-3 text-sm text-amber-100">{evidenceError}</div>
          )}

          {status === 'loading' && <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-8 text-center text-slate-200">Loading Study-Hub catalog…</div>}
          {status === 'error' && (
            <div className="rounded-3xl border border-rose-400/40 bg-rose-950/40 p-6">
              <h2 className="font-bold text-rose-100">Study-Hub unavailable</h2>
              <p className="mt-2 text-sm text-rose-200">{error}</p>
              <p className="mt-3 text-xs text-rose-300">Base: {config.studyHubBaseUrl}{config.studyHubCatalogPath}</p>
            </div>
          )}

          {catalog && status === 'ready' && (
            <>
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Schema', catalog.schemaVersion],
                  ['Subjects', String(catalog.subjects.length)],
                  ['Topics', String(catalog.topics.length)],
                  ['Pages', String(catalog.pages.length)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-cyan-300/20 bg-slate-950/70 p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-cyan-300">{label}</div>
                    <div className="mt-1 text-2xl font-black">{value}</div>
                  </div>
                ))}
              </div>

              {suggestedReview.length > 0 && (
                <section className="mb-5 rounded-3xl border border-amber-300/30 bg-amber-950/25 p-5">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Suggested review</div>
                      <h2 className="mt-1 text-xl font-black">Practice signals from recent scored evidence</h2>
                    </div>
                    <div className="text-xs text-amber-100/70">Evidence signal, not a mastery score</div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {suggestedReview.map((signal) => {
                      const page = catalog.pages.find((entry) => entry.id === signal.pageId);
                      if (!page) return null;
                      return (
                        <button key={signal.pageId} onClick={() => openSuggestedPage(signal.pageId)} className="rounded-2xl border border-amber-300/25 bg-slate-950/55 p-4 text-left transition hover:border-amber-200/60 hover:bg-slate-900/70">
                          <div className="text-xs font-bold text-amber-300">{catalog.topics.find((topic) => topic.id === page.topicId)?.title || page.topicId}</div>
                          <div className="mt-1 font-black text-white">{page.title}</div>
                          <div className="mt-2 text-sm text-amber-100/80">
                            {signal.recentAverageCredit !== null ? `${Math.round(signal.recentAverageCredit * 100)}% recent credit` : 'No scored credit'} · {signal.lowCreditCount} recent miss{signal.lowCreditCount === 1 ? '' : 'es'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
                <aside className="rounded-3xl border border-slate-700 bg-slate-950/75 p-4">
                  <h2 className="mb-3 font-black">Published topics</h2>
                  <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
                    {catalog.topics.map((topic) => {
                      const active = topic.id === selectedTopicId;
                      const needsPractice = topic.pageRefs.filter((pageId) => pageSignals.get(pageId)?.kind === 'needs_practice').length;
                      return (
                        <button key={topic.id} onClick={() => { setSelectedTopicId(topic.id); setSelectedPage(null); }} className={`w-full rounded-2xl border p-3 text-left transition ${active ? 'border-cyan-300 bg-cyan-900/40' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'}`}>
                          <div className="text-xs text-cyan-300">{subjectById.get(topic.subjectId)?.title || topic.subjectId}</div>
                          <div className="font-bold">{topic.title}</div>
                          <div className="mt-1 text-xs text-slate-400">{topic.pageRefs.length} page{topic.pageRefs.length === 1 ? '' : 's'} · {topic.difficulty}</div>
                          {needsPractice > 0 && <div className="mt-1 text-xs font-bold text-amber-300">↻ {needsPractice} page{needsPractice === 1 ? '' : 's'} suggested for review</div>}
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <main className="rounded-3xl border border-slate-700 bg-slate-950/75 p-5 sm:p-6">
                  {!selectedTopic ? (
                    <div className="text-slate-300">
                      {rolloutScoped ? 'No Study-Hub content matches the configured Learn rollout scope.' : 'No published Study-Hub topics are available.'}
                    </div>
                  ) : selectedPage ? (
                    <div>
                      <button onClick={() => setSelectedPage(null)} className="mb-4 text-sm font-bold text-cyan-300 hover:text-cyan-200">← Topic pages</button>
                      <div className="text-xs font-black uppercase tracking-widest text-cyan-300">Study-Hub page · Kani practice</div>
                      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
                        <h2 className="text-2xl font-black">{selectedPage.title}</h2>
                        {selectedLearnerUrl && (
                          <a
                            href={selectedLearnerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-cyan-300/40 bg-cyan-950/50 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-900/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400"
                          >
                            📖 Open full lesson in Study-Hub ↗
                          </a>
                        )}
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <Info label="Page ID" value={selectedPage.id} />
                        <Info label="Topic ID" value={selectedPage.topicId} />
                        <Info label="Kind" value={String(selectedPage.pageKind || 'lesson')} />
                      </div>
                      {selectedPageSignal && (
                        <div className="mt-4 rounded-2xl border border-slate-600 bg-slate-900/60 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Your recent evidence</div>
                              <div className="mt-1 font-black text-white">{revisionSignalLabel(selectedPageSignal)}</div>
                            </div>
                            <SignalBadge signal={selectedPageSignal} />
                          </div>
                          <div className="mt-2 text-sm text-slate-300">
                            {selectedPageSignal.recentAverageCredit !== null ? `${Math.round(selectedPageSignal.recentAverageCredit * 100)}% recent credit` : 'No objectively scored evidence'} · {selectedPageSignal.scoredCount} scored attempt{selectedPageSignal.scoredCount === 1 ? '' : 's'} · {selectedPageSignal.lowCreditCount} below-full-credit result{selectedPageSignal.lowCreditCount === 1 ? '' : 's'}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">This signal is derived from recent canonical attempts and is not a calibrated mastery score.</div>
                        </div>
                      )}
                      <div className="mt-5 rounded-2xl border border-purple-300/20 bg-purple-950/30 p-4 text-sm text-purple-100">
                        Study-Hub owns the full lesson experience. Kani owns the active student, Randomise setting, question runtime, timing, review and canonical attempts.
                      </div>
                      <div className="mt-4 text-sm text-slate-300">
                        Blocks: {Array.isArray(selectedPage.blocks) ? selectedPage.blocks.length : 0} · Clarifiers: {Array.isArray(selectedPage.clarifiers) ? selectedPage.clarifiers.length : 0} · Questions: {Array.isArray(selectedPage.questions) ? selectedPage.questions.length : 0}
                      </div>
                      {selectedPageMeta && <StudyHubPracticePanel page={selectedPage} pageMeta={selectedPageMeta} onAttemptSaved={() => void loadEvidence()} />}
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-cyan-300">{subjectById.get(selectedTopic.subjectId)?.title || selectedTopic.subjectId}</div>
                      <h2 className="mt-1 text-2xl font-black">{selectedTopic.title}</h2>
                      <p className="mt-1 text-sm text-slate-400">Stable ID: {selectedTopic.id}</p>
                      <div className="mt-5 grid gap-3">
                        {pages.map((page) => {
                          const signal = pageSignals.get(page.id);
                          return (
                            <button key={page.id} onClick={() => void openPage(page.id)} disabled={loadingPageId === page.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-left transition hover:border-cyan-300/60 disabled:opacity-50">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="font-bold">{page.title}</div>
                                    {signal && <SignalBadge signal={signal} />}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-400">{page.activityType} · {page.difficulty} · {page.id}</div>
                                  {page.learnerUrl && <div className="mt-1 text-xs text-cyan-300">Full Study-Hub lesson available</div>}
                                  {signal?.recentAverageCredit !== null && signal?.recentAverageCredit !== undefined && (
                                    <div className="mt-1 text-xs text-slate-400">Recent credit {Math.round(signal.recentAverageCredit * 100)}% across {Math.min(signal.scoredCount, 5)} scored result{Math.min(signal.scoredCount, 5) === 1 ? '' : 's'}</div>
                                  )}
                                </div>
                                <span className="text-cyan-300">{loadingPageId === page.id ? 'Loading…' : 'Preview & practice →'}</span>
                              </div>
                            </button>
                          );
                        })}
                        {pages.length === 0 && <div className="text-slate-400">This topic has no published page entries.</div>}
                      </div>
                    </div>
                  )}
                </main>
              </div>
            </>
          )}
        </div>
      </div>
    </SpaceBackground>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
    <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 break-all text-sm font-semibold text-white">{value}</div>
  </div>
);

const SignalBadge: React.FC<{ signal: PageRevisionSignal }> = ({ signal }) => {
  const classes = signal.kind === 'needs_practice'
    ? 'border-amber-300/30 bg-amber-950/40 text-amber-200'
    : signal.kind === 'strong_recent_evidence'
      ? 'border-emerald-300/30 bg-emerald-950/40 text-emerald-200'
      : 'border-slate-500/40 bg-slate-800/70 text-slate-300';
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${classes}`}>{revisionSignalLabel(signal)}</span>;
};
