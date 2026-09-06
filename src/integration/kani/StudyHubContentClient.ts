import {
  KaniCatalogPage,
  KaniCatalogSubject,
  KaniCatalogTopic,
  KaniCatalogV1,
  StudyHubPageDocument,
} from './contracts';
import { parseKaniCatalog, parseStudyHubPageDocument } from './validators';

export type KaniFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface StudyHubContentClientOptions {
  baseUrl: string;
  catalogPath?: string;
  fetchFn?: KaniFetch;
}

export class StudyHubContentError extends Error {
  readonly status?: number;
  readonly url?: string;
  readonly cause?: unknown;

  constructor(message: string, options?: { status?: number; url?: string; cause?: unknown }) {
    super(message);
    this.name = 'StudyHubContentError';
    this.status = options?.status;
    this.url = options?.url;
    this.cause = options?.cause;
  }
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new StudyHubContentError('Study-Hub base URL is required');
  return trimmed.replace(/\/+$/, '');
}

function joinBaseUrl(baseUrl: string, contentPath: string): string {
  if (/^https?:\/\//i.test(contentPath)) return contentPath;
  const normalizedPath = contentPath.replace(/^\/+/, '');
  return `${baseUrl}/${normalizedPath}`;
}

export function resolveStudyHubLearnerUrl(baseUrl: string, learnerUrl: string): string {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const target = learnerUrl.trim();
  if (!target) throw new StudyHubContentError('Study-Hub learner URL is required');
  return joinBaseUrl(normalizedBase, target);
}

export class StudyHubContentClient {
  private readonly baseUrl: string;
  private readonly catalogPath: string;
  private readonly fetchFn: KaniFetch;
  private catalogCache: KaniCatalogV1 | null = null;
  private pageCache = new Map<string, StudyHubPageDocument>();

  constructor(options: StudyHubContentClientOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.catalogPath = options.catalogPath || '/content/catalog.json';
    this.fetchFn = options.fetchFn || fetch.bind(globalThis);
  }

  clearCache() {
    this.catalogCache = null;
    this.pageCache.clear();
  }

  private async fetchJson(url: string): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetchFn(url, { headers: { Accept: 'application/json' } });
    } catch (cause) {
      throw new StudyHubContentError(`Study-Hub is unavailable: ${url}`, { url, cause });
    }
    if (!response.ok) {
      throw new StudyHubContentError(`Study-Hub request failed (${response.status}): ${url}`, {
        status: response.status,
        url,
      });
    }
    try {
      return await response.json();
    } catch (cause) {
      throw new StudyHubContentError(`Study-Hub returned invalid JSON: ${url}`, { url, cause });
    }
  }

  async getCatalog(): Promise<KaniCatalogV1> {
    if (this.catalogCache) return this.catalogCache;
    const url = joinBaseUrl(this.baseUrl, this.catalogPath);
    const raw = await this.fetchJson(url);
    try {
      this.catalogCache = parseKaniCatalog(raw);
      return this.catalogCache;
    } catch (cause) {
      throw new StudyHubContentError('Study-Hub catalog failed Kani contract validation', { url, cause });
    }
  }

  async getSubjects(): Promise<KaniCatalogSubject[]> {
    return (await this.getCatalog()).subjects;
  }

  async getTopics(subjectId?: string): Promise<KaniCatalogTopic[]> {
    const topics = (await this.getCatalog()).topics;
    return subjectId ? topics.filter((topic) => topic.subjectId === subjectId) : topics;
  }

  async getTopic(topicId: string): Promise<KaniCatalogTopic> {
    const topic = (await this.getCatalog()).topics.find((item) => item.id === topicId);
    if (!topic) throw new StudyHubContentError(`Study-Hub topic not found: ${topicId}`);
    return topic;
  }

  async getPageMeta(pageId: string): Promise<KaniCatalogPage> {
    const page = (await this.getCatalog()).pages.find((item) => item.id === pageId);
    if (!page) throw new StudyHubContentError(`Study-Hub page not found: ${pageId}`);
    return page;
  }

  async getPage(pageId: string): Promise<StudyHubPageDocument> {
    const cached = this.pageCache.get(pageId);
    if (cached) return cached;

    const pageMeta = await this.getPageMeta(pageId);
    const url = joinBaseUrl(this.baseUrl, pageMeta.contentUrl);
    const raw = await this.fetchJson(url);
    try {
      const page = parseStudyHubPageDocument(raw, { id: pageMeta.id, topicId: pageMeta.topicId });
      this.pageCache.set(pageId, page);
      return page;
    } catch (cause) {
      throw new StudyHubContentError(`Study-Hub page failed validation: ${pageId}`, { url, cause });
    }
  }
}
