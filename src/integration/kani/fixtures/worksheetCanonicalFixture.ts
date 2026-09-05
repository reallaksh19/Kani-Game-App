import { KaniQuestion } from '../contracts';

const common = {
  schemaVersion: '1.0' as const,
  subjectId: 'mathematics',
  topicId: 'worksheet-integration-demo',
  grade: 'Grade 4',
  skillIds: ['skill_number_reasoning'],
  conceptTags: ['worksheet-integration'],
  curriculumTags: ['integration-fixture'],
  cognitiveDemand: '1-2 step',
};

/**
 * Representative Worksheet App -> kani-content-v1 conversion fixture.
 * It is intentionally small and is not production curriculum content.
 */
export const WORKSHEET_CANONICAL_FIXTURE: KaniQuestion[] = [
  {
    ...common,
    id: 'worksheet-demo-mcq-1',
    type: 'mcq',
    difficulty: 'easy',
    prompt: 'Which number is even?',
    options: ['13', '18', '21', '25'],
    answerIndex: 1,
    hint: 'An even number can be divided by 2 with no remainder.',
    explanation: '18 is divisible by 2.'
  },
  {
    ...common,
    id: 'worksheet-demo-tf-1',
    type: 'true_false',
    difficulty: 'easy',
    prompt: '4 × 6 = 24.',
    answer: true,
    explanation: 'Four groups of six total twenty-four.'
  },
  {
    ...common,
    id: 'worksheet-demo-fill-1',
    type: 'fill_in_blank',
    difficulty: 'medium',
    prompt: 'Complete the number sentence: 35 + ___ = 50.',
    acceptedAnswers: [15, '15'],
    caseSensitive: false,
    hint: 'Find the difference between 50 and 35.',
    explanation: '50 − 35 = 15.'
  },
  {
    ...common,
    id: 'worksheet-demo-short-1',
    type: 'short_answer',
    difficulty: 'medium',
    prompt: 'Write 1/2 in words.',
    acceptedAnswers: ['one half', 'one-half'],
    caseSensitive: false,
    explanation: 'The fraction 1/2 is read as one half.'
  },
  {
    ...common,
    id: 'worksheet-demo-multi-1',
    type: 'multi_select',
    difficulty: 'hard',
    prompt: 'Select all multiples of 4.',
    options: ['8', '10', '12', '15'],
    answerIndexes: [0, 2],
    hint: 'Multiples of 4 are 4, 8, 12, 16, ...',
    explanation: '8 = 4 × 2 and 12 = 4 × 3.'
  }
];
