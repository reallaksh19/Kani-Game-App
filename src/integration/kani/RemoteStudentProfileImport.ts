import { StudentProfile } from '../../types';
import { saveStudentProfiles } from '../../utils/studentProfiles';
import { RemoteStudentProfile } from './LearnerApiClient';

export interface RemoteProfileConflict {
  studentId: string;
  local: StudentProfile;
  remote: RemoteStudentProfile;
}

export interface RemoteProfileLocalImportPlan {
  importable: RemoteStudentProfile[];
  alreadyLocal: StudentProfile[];
  conflicts: RemoteProfileConflict[];
}

export interface RemoteProfileLocalImportResult extends RemoteProfileLocalImportPlan {
  imported: StudentProfile[];
  profiles: StudentProfile[];
  wrote: boolean;
}

function sameProfile(local: StudentProfile, remote: RemoteStudentProfile): boolean {
  return local.id === remote.id
    && local.name === remote.name
    && local.avatar === remote.avatar
    && local.grade === remote.grade;
}

export function planRemoteProfilesForLocalImport(
  localProfiles: readonly StudentProfile[],
  remoteProfiles: readonly RemoteStudentProfile[],
): RemoteProfileLocalImportPlan {
  const localById = new Map(localProfiles.map((profile) => [profile.id, profile]));
  const importable: RemoteStudentProfile[] = [];
  const alreadyLocal: StudentProfile[] = [];
  const conflicts: RemoteProfileConflict[] = [];

  for (const remote of remoteProfiles) {
    const local = localById.get(remote.id);
    if (!local) importable.push(remote);
    else if (sameProfile(local, remote)) alreadyLocal.push(local);
    else conflicts.push({ studentId: remote.id, local, remote });
  }

  return { importable, alreadyLocal, conflicts };
}

export function remoteProfileToLocal(
  remote: RemoteStudentProfile,
  nowIso = new Date().toISOString(),
): StudentProfile {
  return {
    id: remote.id,
    name: remote.name,
    avatar: remote.avatar,
    grade: remote.grade,
    createdAt: remote.createdAt || nowIso,
    lastLoginAt: nowIso,
  };
}

/**
 * Explicit second-device import. Stable student IDs and profile data are preserved
 * exactly; a same-ID mismatch is a hard conflict and causes the whole write to
 * fail closed. Display names are never used as merge keys.
 */
export async function importRemoteProfilesLocally(
  localProfiles: readonly StudentProfile[],
  remoteProfiles: readonly RemoteStudentProfile[],
  options: {
    save?: (profiles: StudentProfile[]) => Promise<void>;
    nowIso?: string;
  } = {},
): Promise<RemoteProfileLocalImportResult> {
  const plan = planRemoteProfilesForLocalImport(localProfiles, remoteProfiles);
  if (plan.conflicts.length > 0) {
    return {
      ...plan,
      imported: [],
      profiles: [...localProfiles],
      wrote: false,
    };
  }

  if (plan.importable.length === 0) {
    return {
      ...plan,
      imported: [],
      profiles: [...localProfiles],
      wrote: false,
    };
  }

  const nowIso = options.nowIso || new Date().toISOString();
  const imported = plan.importable.map((profile) => remoteProfileToLocal(profile, nowIso));
  const profiles = [...localProfiles, ...imported];
  await (options.save || saveStudentProfiles)(profiles);

  return {
    ...plan,
    imported,
    profiles,
    wrote: true,
  };
}
