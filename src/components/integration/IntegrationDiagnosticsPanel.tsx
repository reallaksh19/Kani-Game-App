import React, { useMemo } from 'react';
import { KaniCatalogV1 } from '../../integration/kani/contracts';
import { getKaniIntegrationConfig } from '../../integration/kani/integrationConfig';

interface IntegrationDiagnosticsPanelProps {
  catalog?: KaniCatalogV1 | null;
  catalogStatus: 'loading' | 'ready' | 'error';
  error?: string;
}

export const IntegrationDiagnosticsPanel: React.FC<IntegrationDiagnosticsPanelProps> = ({ catalog, catalogStatus, error }) => {
  const config = useMemo(() => getKaniIntegrationConfig(), []);
  const statusLabel = catalogStatus === 'ready' ? 'Reachable' : catalogStatus === 'loading' ? 'Checking…' : 'Unavailable';

  return (
    <details className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/65 p-4 text-sm text-slate-200">
      <summary className="cursor-pointer font-bold text-slate-100">🔧 Integration diagnostics</summary>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Diagnostic label="Study-Hub base" value={config.studyHubBaseUrl} />
        <Diagnostic label="Catalog path" value={config.studyHubCatalogPath} />
        <Diagnostic label="Catalog" value={statusLabel} />
        <Diagnostic label="Schema" value={catalog?.schemaVersion || '—'} />
        <Diagnostic label="Published/visible content" value={catalog ? `${catalog.subjects.length} subjects · ${catalog.topics.length} topics · ${catalog.pages.length} pages` : '—'} />
        <Diagnostic label="Allowed Study-Hub origins" value={config.allowedStudyHubOrigins.join(', ') || 'none'} />
        <Diagnostic label="Allowed Learn subjects" value={config.allowedStudyHubSubjectIds.join(', ') || 'all'} />
        <Diagnostic label="Allowed Learn grades" value={config.allowedStudyHubGrades.join(', ') || 'all'} />
        <Diagnostic label="Learn flag" value={config.integrationLearnEnabled ? 'enabled' : 'disabled'} />
        <Diagnostic label="Practice flag" value={config.integrationPracticeEnabled ? 'enabled' : 'disabled'} />
      </div>
      {error && <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-950/30 p-3 text-rose-200">Last integration error: {error}</div>}
      <p className="mt-3 text-xs text-slate-500">No API keys, write tokens or other secrets are shown in this panel.</p>
    </details>
  );
};

const Diagnostic: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 break-all font-mono text-xs text-slate-100">{value}</div>
  </div>
);
