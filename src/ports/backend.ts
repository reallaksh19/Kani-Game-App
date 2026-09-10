import type { KaniAttemptV1 } from '../domain/contracts';
import type { StudentRecord } from './storage';

export interface StoredStudentProfile extends Omit<StudentRecord, 'householdId'> {
  createdAt: string;
  updatedAt: string;
}

export interface AttemptHistoryCursor {
  completedAt: string;
  attemptId: string;
}

export interface AttemptHistoryPage {
  attempts: KaniAttemptV1[];
  nextCursor: AttemptHistoryCursor | null;
}

export interface AttemptEvidenceWindow {
  attempts: KaniAttemptV1[];
  truncated: boolean;
}

export interface AttemptBatchSaveResult {
  accepted: number;
  created: number;
  existing: number;
  idempotentReplay: boolean;
}

export interface WriteQuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
  retryAfterSeconds: number;
}

export interface BackendHealth {
  ready: boolean;
  storage: 'sqlite';
  migrationVersion: number;
}

/**
 * Provider-neutral persistence surface required by the stable Kani HTTP API.
 * Infrastructure adapters may implement additional low-level KaniStore ports,
 * but application request handling depends only on this interface.
 */
export interface KaniApiStore {
  listHouseholdIdsForUser(userId: string): Promise<string[]>;
  isHouseholdMember(householdId: string, userId: string): Promise<boolean>;
  listStudents(householdId: string): Promise<StoredStudentProfile[]>;
  createStudent(householdId: string, student: Omit<StudentRecord, 'householdId'>): Promise<{ created: boolean; student: StoredStudentProfile }>;
  hasStudent(householdId: string, studentId: string): Promise<boolean>;
  saveAttempts(householdId: string, attempts: readonly KaniAttemptV1[]): Promise<AttemptBatchSaveResult>;
  listAttemptPage(householdId: string, studentId: string, options: { limit: number; cursor: AttemptHistoryCursor | null }): Promise<AttemptHistoryPage>;
  listEvidenceWindow(householdId: string, studentId: string, limit: number): Promise<AttemptEvidenceWindow>;
  consumeWriteQuota(userId: string, cost: number, options: { limit: number; nowMs: number }): Promise<WriteQuotaResult>;
  health(): Promise<BackendHealth>;
}

export class StorageRecordNotFoundError extends Error {
  readonly entity: string;
  readonly id: string;

  constructor(entity: string, id: string) {
    super(`${entity} ${id} was not found.`);
    this.name = 'StorageRecordNotFoundError';
    this.entity = entity;
    this.id = id;
  }
}
