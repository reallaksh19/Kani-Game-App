import type { AttemptFilter, KaniAttemptV1 } from '../domain/contracts';

export interface AttemptRepository {
  recordAttempt(input: KaniAttemptV1): Promise<void>;
  listAttempts(studentId: string, filter?: AttemptFilter): Promise<KaniAttemptV1[]>;
}

export type AttemptStore = AttemptRepository;

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export interface HouseholdRecord {
  householdId: string;
}

export interface StudentRecord {
  householdId: string;
  studentId: string;
  name: string;
  avatar: string;
  grade: string;
}

export interface MembershipRecord {
  householdId: string;
  userId: string;
  role: 'guardian';
}

export interface HouseholdRepository {
  put(record: HouseholdRecord): Promise<void>;
  get(householdId: string): Promise<HouseholdRecord | null>;
}

export interface StudentRepository {
  put(record: StudentRecord): Promise<void>;
  get(householdId: string, studentId: string): Promise<StudentRecord | null>;
  listByHousehold(householdId: string): Promise<StudentRecord[]>;
}

export interface MembershipRepository {
  put(record: MembershipRecord): Promise<void>;
  listByUser(userId: string): Promise<MembershipRecord[]>;
  isMember(householdId: string, userId: string): Promise<boolean>;
}

export interface KaniStore {
  households: HouseholdRepository;
  students: StudentRepository;
  memberships: MembershipRepository;
  attempts: AttemptRepository;
}

export class ImmutableRecordConflictError extends Error {
  readonly entity: string;
  readonly id: string;

  constructor(entity: string, id: string) {
    super(`${entity} ${id} already exists with a different immutable payload.`);
    this.name = 'ImmutableRecordConflictError';
    this.entity = entity;
    this.id = id;
  }
}
