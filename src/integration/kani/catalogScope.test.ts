import { describe, expect, it } from 'vitest';
import { KaniCatalogV1 } from './contracts';
import { scopeKaniCatalog } from './catalogScope';

const catalog: KaniCatalogV1 = {
  schemaVersion: '1.0',
  publishedAt: '2026-09-06T02:00:00.000Z',
  sourceApp: 'study-hub',
  subjects: [
    { id: 'mathematics', title: 'Mathematics', grade: 'Grade 4' },
    { id: 'science', title: 'Science', grade: 'Grade 8' },
  ],
  topics: [
    {
      id: 'math-fractions',
      subjectId: 'mathematics',
      title: 'Fractions',
      difficulty: 'medium',
      conceptTags: ['fractions'],
      pageRefs: ['math-g4', 'math-g5'],
    },
    {
      id: 'science-force',
      subjectId: 'science',
      title: 'Force',
      grade: 'Grade 8',
      difficulty: 'medium',
      conceptTags: ['force'],
      pageRefs: ['science-g8'],
    },
  ],
  pages: [
    {
      id: 'math-g4',
      topicId: 'math-fractions',
      subjectId: 'mathematics',
      title: 'Grade 4 fractions',
      activityType: 'lesson',
      contentUrl: '/math/g4.json',
      learnerUrl: '#/topic/math-fractions/page/math-g4',
      difficulty: 'easy',
      skillIds: [],
      conceptTags: ['fractions'],
    },
    {
      id: 'math-g5',
      topicId: 'math-fractions',
      subjectId: 'mathematics',
      title: 'Grade 5 extension',
      activityType: 'lesson',
      contentUrl: '/math/g5.json',
      grade: 'Grade 5',
      difficulty: 'hard',
      skillIds: [],
      conceptTags: ['fractions'],
    },
    {
      id: 'science-g8',
      topicId: 'science-force',
      subjectId: 'science',
      title: 'Force',
      activityType: 'lesson',
      contentUrl: '/science/g8.json',
      difficulty: 'medium',
      skillIds: [],
      conceptTags: ['force'],
    },
  ],
};

describe('scopeKaniCatalog', () => {
  it('preserves the full catalog when no rollout scope is configured', () => {
    const scoped = scopeKaniCatalog(catalog, {});
    expect(scoped.subjects).toHaveLength(2);
    expect(scoped.topics).toHaveLength(2);
    expect(scoped.pages).toHaveLength(3);
    expect(scoped).not.toBe(catalog);
    expect(scoped.topics[0].pageRefs).not.toBe(catalog.topics[0].pageRefs);
  });

  it('filters by stable subject id without mutating source references', () => {
    const before = catalog.topics[0].pageRefs.slice();
    const scoped = scopeKaniCatalog(catalog, { subjectIds: ['MATHEMATICS'] });
    expect(scoped.subjects.map((subject) => subject.id)).toEqual(['mathematics']);
    expect(scoped.topics.map((topic) => topic.id)).toEqual(['math-fractions']);
    expect(scoped.pages.map((page) => page.id)).toEqual(['math-g4', 'math-g5']);
    expect(catalog.topics[0].pageRefs).toEqual(before);
  });

  it('uses page, topic then subject grade metadata and removes empty references', () => {
    const scoped = scopeKaniCatalog(catalog, { grades: ['grade 4'] });
    expect(scoped.subjects.map((subject) => subject.id)).toEqual(['mathematics']);
    expect(scoped.topics).toHaveLength(1);
    expect(scoped.topics[0].pageRefs).toEqual(['math-g4']);
    expect(scoped.pages.map((page) => page.id)).toEqual(['math-g4']);
  });

  it('requires both subject and grade filters when both are configured', () => {
    const scoped = scopeKaniCatalog(catalog, {
      subjectIds: ['science'],
      grades: ['Grade 4'],
    });
    expect(scoped.subjects).toEqual([]);
    expect(scoped.topics).toEqual([]);
    expect(scoped.pages).toEqual([]);
  });
});
