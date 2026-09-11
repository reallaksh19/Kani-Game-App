import type { PrimaryMissionBundle } from './PrimaryMissionClient';

export interface PrimaryMissionCopy {
  title: string;
  loadingTitle: string;
  loadingBody: string;
  completionTitle: string;
  returnBody: string;
  returnButton: string;
  icon: string;
}

export function buildPrimaryReturnUrl(baseUrl: string, returnLearnerPath: string, opaqueId: string): string {
  const root = baseUrl.trim().replace(/\/+$/, '');
  const learnerPath = returnLearnerPath.trim();
  if (!root) throw new Error('Study-Hub base URL is required');
  if (!learnerPath.startsWith('/primary/')) throw new Error('Primary return learner path must stay under /primary/');
  return `${root}/${learnerPath.replace(/^\/+/, '')}?mission=${encodeURIComponent(opaqueId)}`;
}

export function primaryMissionCopy(bundle: PrimaryMissionBundle): PrimaryMissionCopy {
  const subjectId = bundle.questions[0]?.subjectId?.toLowerCase();
  const renderer = bundle.route.renderer.toLowerCase();

  if (renderer === 'inference-investigator' || subjectId === 'english') {
    return {
      title: 'Inference Investigator',
      loadingTitle: 'Loading your reading mission…',
      loadingBody: 'Kani is checking the reading mission with Study-Hub.',
      completionTitle: 'Nice work finishing the inference activity.',
      returnBody: 'Now show the reading idea outside the game with an answer, a text clue, and the connection between them.',
      returnButton: 'Back to my reading page →',
      icon: '🔎',
    };
  }

  if (renderer === 'fraction-frenzy' || subjectId === 'mathematics') {
    return {
      title: 'Fraction Mission',
      loadingTitle: 'Loading your fraction mission…',
      loadingBody: 'Kani is checking the fraction mission with Study-Hub.',
      completionTitle: 'Nice work finishing the fraction activity.',
      returnBody: 'Now show what you know outside the game. The return task uses a different question from the game questions.',
      returnButton: 'Back to my fraction page →',
      icon: '🚀',
    };
  }

  return {
    title: 'Learning Mission',
    loadingTitle: 'Loading your learning mission…',
    loadingBody: 'Kani is checking the mission with Study-Hub.',
    completionTitle: 'Nice work finishing the learning activity.',
    returnBody: 'Now show what you know outside the game on the independent return task.',
    returnButton: 'Back to my learning page →',
    icon: '✨',
  };
}
