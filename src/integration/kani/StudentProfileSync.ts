import { StudentProfile } from '../../types';
import { LearnerApiClient, RemoteStudentProfile } from './LearnerApiClient';

export interface StudentProfileConflict {
  studentId: string;
  local: StudentProfile;
  remote: RemoteStudentProfile;
}

export interface StudentProfileSyncPlan {
  imports: StudentProfile[];
  alreadyLinked: StudentProfile[];
  remoteOnly: RemoteStudentProfile[];
  conflicts: StudentProfileConflict[];
}

function sameProfile(local: StudentProfile, remote: RemoteStudentProfile): boolean {
  return local.id === remote.id
    && local.name === remote.name
    && local.avatar === remote.avatar
    && local.grade === remote.grade;
}

export function planStudentProfileSync(
  localProfiles: readonly StudentProfile[],
  remoteProfiles: readonly RemoteStudentProfile[],
): StudentProfileSyncPlan {
  const remoteById = new Map(remoteProfiles.map((profile) => [profile.id, profile]));
  const localIds = new Set(localProfiles.map((profile) => profile.id));
  const imports: StudentProfile[] = [];
  const alreadyLinked: StudentProfile[] = [];
  const conflicts: StudentProfileConflict[] = [];

  for (const local of localProfiles) {
    const remote = remoteById.get(local.id);
    if (!remote) imports.push(local);
    else if (sameProfile(local, remote)) alreadyLinked.push(local);
    else conflicts.push({ studentId: local.id, local, remote });
  }

  return {
    imports,
    alreadyLinked,
    remoteOnly: remoteProfiles.filter((profile) => !localIds.has(profile.id)),
    conflicts,
  };
}

export interface StudentProfileImportResult {
  imported: RemoteStudentProfile[];
  conflicts: StudentProfileConflict[];
  remoteOnly: RemoteStudentProfile[];
  alreadyLinked: StudentProfile[];
}

/**
 * Non-destructively imports local Kani profiles into the authenticated household.
 * Existing conflicting stable IDs are never overwritten automatically.
 */
export async function importLocalStudentProfiles(
  api: LearnerApiClient,
  localProfiles: readonly StudentProfile[],
): Promise<StudentProfileImportResult> {
  const remote = await api.listStudents();
  const plan = planStudentProfileSync(localProfiles, remote);
  if (plan.conflicts.length > 0) {
    return {
      imported: [],
      conflicts: plan.conflicts,
      remoteOnly: plan.remoteOnly,
      alreadyLinked: plan.alreadyLinked,
    };
  }

  const imported: RemoteStudentProfile[] = [];
  for (const profile of plan.imports) {
    imported.push(await api.importStudent({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      grade: profile.grade,
    }));
  }

  return {
    imported,
    conflicts: [],
    remoteOnly: plan.remoteOnly,
    alreadyLinked: plan.alreadyLinked,
  };
}
