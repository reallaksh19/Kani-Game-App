export interface KaniIntegrationConfig {
  studyHubBaseUrl: string;
  studyHubCatalogPath: string;
  allowedStudyHubOrigins: string[];
  allowedStudyHubSubjectIds: string[];
  allowedStudyHubGrades: string[];
  integrationLearnEnabled: boolean;
  integrationPracticeEnabled: boolean;
}

function readEnv(name: string): string | undefined {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const value = env?.[name];
  return value?.trim() || undefined;
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const value = readEnv(name);
  if (value == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function parseCsv(raw: string | undefined): string[] {
  return [...new Set((raw || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean))];
}

function parseOrigins(raw: string | undefined, baseUrl: string): string[] {
  const explicit = parseCsv(raw);
  if (explicit.length > 0) return explicit;
  try {
    return [new URL(baseUrl).origin];
  } catch {
    return [];
  }
}

export function getKaniIntegrationConfig(): KaniIntegrationConfig {
  const studyHubBaseUrl = normalizeBaseUrl(
    readEnv('VITE_STUDY_HUB_BASE_URL') || 'https://reallaksh19.github.io/Study-Hub'
  );
  return {
    studyHubBaseUrl,
    studyHubCatalogPath: readEnv('VITE_STUDY_HUB_CATALOG_PATH') || '/content/catalog.json',
    allowedStudyHubOrigins: parseOrigins(readEnv('VITE_STUDY_HUB_ALLOWED_ORIGINS'), studyHubBaseUrl),
    allowedStudyHubSubjectIds: parseCsv(readEnv('VITE_STUDY_HUB_ALLOWED_SUBJECTS')),
    allowedStudyHubGrades: parseCsv(readEnv('VITE_STUDY_HUB_ALLOWED_GRADES')),
    integrationLearnEnabled: readBooleanEnv('VITE_KANI_LEARN_ENABLED', false),
    integrationPracticeEnabled: readBooleanEnv('VITE_KANI_PRACTICE_ENABLED', false),
  };
}
