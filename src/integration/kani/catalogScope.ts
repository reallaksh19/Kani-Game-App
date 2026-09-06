import { KaniCatalogV1 } from './contracts';

export interface KaniCatalogScope {
  subjectIds?: readonly string[];
  grades?: readonly string[];
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function normalizedSet(values: readonly string[] | undefined): Set<string> {
  return new Set((values || []).map(normalize).filter(Boolean));
}

export function scopeKaniCatalog(catalog: KaniCatalogV1, scope: KaniCatalogScope): KaniCatalogV1 {
  const allowedSubjects = normalizedSet(scope.subjectIds);
  const allowedGrades = normalizedSet(scope.grades);

  if (allowedSubjects.size === 0 && allowedGrades.size === 0) {
    return {
      ...catalog,
      subjects: [...catalog.subjects],
      topics: catalog.topics.map((topic) => ({ ...topic, pageRefs: [...topic.pageRefs] })),
      pages: [...catalog.pages],
    };
  }

  const subjectById = new Map(catalog.subjects.map((subject) => [subject.id, subject]));
  const topicById = new Map(catalog.topics.map((topic) => [topic.id, topic]));

  const subjectAllowed = (subjectId: string) => allowedSubjects.size === 0 || allowedSubjects.has(normalize(subjectId));
  const gradeAllowed = (grade: string | undefined) => allowedGrades.size === 0 || (!!grade && allowedGrades.has(normalize(grade)));

  const pages = catalog.pages.filter((page) => {
    if (!subjectAllowed(page.subjectId)) return false;
    const topic = topicById.get(page.topicId);
    const subject = subjectById.get(page.subjectId);
    const effectiveGrade = page.grade || topic?.grade || subject?.grade;
    return gradeAllowed(effectiveGrade);
  });
  const pageIds = new Set(pages.map((page) => page.id));

  const topics = catalog.topics
    .filter((topic) => subjectAllowed(topic.subjectId) && topic.pageRefs.some((pageId) => pageIds.has(pageId)))
    .map((topic) => ({ ...topic, pageRefs: topic.pageRefs.filter((pageId) => pageIds.has(pageId)) }));

  const subjects = catalog.subjects.filter((subject) => subjectAllowed(subject.id) && topics.some((topic) => topic.subjectId === subject.id));

  return {
    ...catalog,
    subjects,
    topics,
    pages,
  };
}
