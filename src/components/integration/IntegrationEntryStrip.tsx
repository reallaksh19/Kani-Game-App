import React, { useMemo } from 'react';
import { getKaniIntegrationConfig } from '../../integration/kani/integrationConfig';

export const IntegrationEntryStrip: React.FC<{ onNavigate: (destination: 'learn' | 'practice') => void }> = ({ onNavigate }) => {
  const config = useMemo(() => getKaniIntegrationConfig(), []);
  if (!config.integrationLearnEnabled && !config.integrationPracticeEnabled) return null;

  return (
    <div className="relative z-20 mb-5 flex w-full max-w-3xl flex-wrap justify-center gap-3" aria-label="Kani integrated learning modes">
      {config.integrationLearnEnabled && (
        <button onClick={() => onNavigate('learn')} className="flex min-w-[210px] items-center gap-3 rounded-2xl border border-cyan-300/40 bg-cyan-950/75 px-5 py-3 text-left text-white shadow-lg backdrop-blur transition hover:scale-[1.02] hover:bg-cyan-900/80 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400">
          <span className="text-3xl">📚</span>
          <span><strong className="block">Learn</strong><span className="text-xs text-cyan-200">Study-Hub lessons</span></span>
        </button>
      )}
      {config.integrationPracticeEnabled && (
        <button onClick={() => onNavigate('practice')} className="flex min-w-[210px] items-center gap-3 rounded-2xl border border-purple-300/40 bg-purple-950/75 px-5 py-3 text-left text-white shadow-lg backdrop-blur transition hover:scale-[1.02] hover:bg-purple-900/80 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400">
          <span className="text-3xl">📝</span>
          <span><strong className="block">Practice</strong><span className="text-xs text-purple-200">Canonical worksheets</span></span>
        </button>
      )}
    </div>
  );
};
