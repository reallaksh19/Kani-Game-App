import { KaniQuestion } from '../../integration/kani/contracts';
import { QuestionSessionConfig } from './types';

export function shuffleCopy<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function selectSessionQuestions(
  questions: readonly KaniQuestion[],
  config: QuestionSessionConfig,
  random: () => number = Math.random,
): KaniQuestion[] {
  const difficultyFiltered = config.difficulty && !['none', 'mixed'].includes(config.difficulty)
    ? questions.filter((question) => question.difficulty === config.difficulty)
    : [...questions];

  const ordered = config.randomize ? shuffleCopy(difficultyFiltered, random) : [...difficultyFiltered];
  const limit = config.limit == null ? ordered.length : Math.max(0, Math.floor(config.limit));
  return ordered.slice(0, limit);
}
