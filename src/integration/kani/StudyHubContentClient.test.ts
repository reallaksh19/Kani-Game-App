import { describe, expect, it, vi } from 'vitest';
import { StudyHubContentClient, StudyHubContentError } from './StudyHubContentClient';

const catalog = {
  schemaVersion: '1.0',
  publishedAt: '2026-09-05T13:50:00.000Z',
  sourceApp: 'study-hub',
  subjects: [{ id: 'mathematics', title: 'Mathematics', order: 1 }],
  topics: [{
    id: 'math-fractions',
    subjectId: 'mathematics',
    title: 'Fractions',
    difficulty: 'medium',
    conceptTags: ['fractions'],
    pageRefs: ['math-fractions-intro'],
  }],
  pages: [{
    id: 'math-fractions-intro',
    topicId: 'math-fractions',
    subjectId: 'mathematics',
    title: 'Fractions introduction',
    activityType: 'lesson',
    contentUrl: '/Mathematics/fractions/pages/intro.json',
    difficulty: 'easy',
    skillIds: [],
    conceptTags: ['fractions'],
  }],
};

const page = {
  id: 'math-fractions-intro',
  topicId: 'math-fractions',
  title: 'Fractions introduction',
  pageKind: 'lesson',
  blocks: [],
  clarifiers: [],
  questions: [],
};

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('StudyHubContentClient', () => {
  it('loads and caches a valid catalog and page without filesystem inference', async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/content/catalog.json')) return jsonResponse(catalog);
      if (url.endsWith('/Mathematics/fractions/pages/intro.json')) return jsonResponse(page);
      return jsonResponse({ error: 'not found' }, 404);
    });
    const client = new StudyHubContentClient({
      baseUrl: 'https://example.test/Study-Hub/',
      fetchFn,
    });

    expect((await client.getSubjects())[0].id).toBe('mathematics');
    expect((await client.getTopic('math-fractions')).title).toBe('Fractions');
    expect((await client.getPage('math-fractions-intro')).title).toBe('Fractions introduction');
    expect((await client.getPage('math-fractions-intro')).id).toBe('math-fractions-intro');

    expect(fetchFn).toHaveBeenCalledWith(
      'https://example.test/Study-Hub/content/catalog.json',
      expect.any(Object),
    );
    expect(fetchFn).toHaveBeenCalledWith(
      'https://example.test/Study-Hub/Mathematics/fractions/pages/intro.json',
      expect.any(Object),
    );
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid catalog contracts', async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ ...catalog, schemaVersion: '2.0' }));
    const client = new StudyHubContentClient({ baseUrl: 'https://example.test/Study-Hub', fetchFn });
    await expect(client.getCatalog()).rejects.toBeInstanceOf(StudyHubContentError);
  });

  it('reports offline/network failures as typed content errors', async () => {
    const fetchFn = vi.fn(async () => { throw new Error('offline'); });
    const client = new StudyHubContentClient({ baseUrl: 'https://example.test/Study-Hub', fetchFn });
    await expect(client.getCatalog()).rejects.toMatchObject({ name: 'StudyHubContentError' });
  });

  it('rejects duplicate catalog ids', async () => {
    const invalid = { ...catalog, subjects: [...catalog.subjects, catalog.subjects[0]] };
    const fetchFn = vi.fn(async () => jsonResponse(invalid));
    const client = new StudyHubContentClient({ baseUrl: 'https://example.test/Study-Hub', fetchFn });
    await expect(client.getCatalog()).rejects.toBeInstanceOf(StudyHubContentError);
  });
});
