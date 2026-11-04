/**
 * Implementacao em memoria de todas as operacoes do `apiClient`.
 *
 * Em modo demo o `apiClient` desvia cada chamada para c'a em vez de falar com o
 * backend: as telas continuam completas, navegaveis e ate mutaveis, porem tudo
 * vive nas sementes de `data/mockPlatform` e some ao recarregar a pagina.
 */
import {
  immersiveTrainingsSeed,
  lessonProgressSeed,
  modulesSeed,
  organizationsSeed,
  studentGroupMembershipsSeed,
  studentGroupModuleAccessSeed,
  studentGroupsSeed,
  studyLessonsSeed,
  studyMaterialsSeed,
  studyTracksSeed,
  trackAssignmentsSeed,
  trainingAttemptsSeed,
  usersSeed,
  type StudentGroupMembershipStatus,
  type UserRecord,
} from '../data/mockPlatform';
import { ApiError } from './apiError';
import { buildDemoToken, readDemoTokenUserId } from './demoMode';
import type {
  ApiSessionUser,
  GroupMutationPayload,
  ImmersiveTrainingMutationPayload,
  LoginResponse,
  OrganizationMutationPayload,
  ProfileUpdatePayload,
  StudyLessonMutationPayload,
  StudyMaterialMutationPayload,
  StudyModuleMutationPayload,
  StudyPackageMutationPayload,
  StudyTrackMutationPayload,
  TrainingLaunchResponse,
  UserMutationPayload,
} from './apiClient';

/** Latencia artificial para que estados de carregamento apareçam na vitrine. */
const SIMULATED_LATENCY_MS = 220;

let idCounter = 0;

function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-demo-${idCounter}`;
}

function nowIso() {
  return new Date().toISOString();
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), SIMULATED_LATENCY_MS);
  });
}

function toSessionUser(user: UserRecord): ApiSessionUser {
  return {
    id: user.id,
    organization_id: user.organizationId,
    organization_name: user.organizationName,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    last_access_at: user.lastAccessAt ?? null,
  };
}

function requireUserFromToken(token: string | null | undefined): UserRecord {
  const userId = readDemoTokenUserId(token);
  const user = userId ? usersSeed.find((record) => record.id === userId) : null;

  if (!user) {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  return user;
}

function organizationNameFor(organizationId: string | null) {
  if (!organizationId) return null;

  return organizationsSeed.find((org) => org.id === organizationId)?.name ?? null;
}

/** Mantem os contadores agregados da organizacao coerentes apos as mutacoes. */
function recalculateOrganizationCounters() {
  for (const organization of organizationsSeed) {
    organization.totalUsers = usersSeed.filter(
      (user) => user.organizationId === organization.id && user.status !== 'inactive'
    ).length;
    organization.activeModules = modulesSeed.filter((module) =>
      module.organizationIds.includes(organization.id)
    ).length;
  }
}

export async function demoLogin(email: string, password: string): Promise<LoginResponse> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = usersSeed.find((record) => record.email.toLowerCase() === normalizedEmail);

  if (!user || user.status === 'inactive' || password.trim().length < 6) {
    throw new ApiError(401, 'Invalid email or password');
  }

  user.lastAccessAt = nowIso();

  return delay<LoginResponse>({
    access_token: buildDemoToken(user.id),
    token_type: 'bearer',
    expires_in: 60 * 60 * 8,
    user: toSessionUser(user),
  });
}

export async function demoSnapshot<T>(): Promise<T> {
  recalculateOrganizationCounters();

  // Copias rasas: `applyPlatformSnapshot` reescreve as sementes com o que
  // devolvemos aqui, entao nao pode receber as proprias referencias vivas.
  return delay({
    organizations: [...organizationsSeed],
    users: [...usersSeed],
    studentGroups: [...studentGroupsSeed],
    studentGroupMemberships: [...studentGroupMembershipsSeed],
    studentGroupModuleAccess: [...studentGroupModuleAccessSeed],
    modules: [...modulesSeed],
    studyMaterials: [...studyMaterialsSeed],
    immersiveTrainings: [...immersiveTrainingsSeed],
    studyTracks: [...studyTracksSeed],
    studyLessons: [...studyLessonsSeed],
    trackAssignments: [...trackAssignmentsSeed],
    lessonProgress: [...lessonProgressSeed],
    trainingAttempts: [...trainingAttemptsSeed],
  } as T);
}

export async function demoUpdateCurrentProfile(
  token: string,
  payload: ProfileUpdatePayload
): Promise<ApiSessionUser> {
  const user = requireUserFromToken(token);

  if (payload.newPassword && !payload.currentPassword) {
    throw new ApiError(400, 'Current password is required');
  }

  const emailTaken = usersSeed.some(
    (record) => record.id !== user.id && record.email.toLowerCase() === payload.email.toLowerCase()
  );

  if (emailTaken) {
    throw new ApiError(409, 'Email already exists');
  }

  user.name = payload.name;
  user.email = payload.email;
  user.documentNumber = payload.documentNumber;
  user.sex = payload.sex;
  user.birthDate = payload.birthDate;

  return delay(toSessionUser(user));
}

export async function demoUpdateLessonProgress<T>(
  token: string,
  lessonId: string,
  status: string
): Promise<T> {
  const user = requireUserFromToken(token);
  const timestamp = nowIso();
  const progressStatus = status as (typeof lessonProgressSeed)[number]['status'];

  if (!studyLessonsSeed.some((lesson) => lesson.id === lessonId)) {
    throw new ApiError(404, 'Lesson not found');
  }

  const existing = lessonProgressSeed.find(
    (record) => record.learnerId === user.id && record.lessonId === lessonId
  );

  if (existing) {
    existing.status = progressStatus;
    existing.startedAt = existing.startedAt ?? (status === 'not_started' ? null : timestamp);
    existing.completedAt = status === 'completed' ? timestamp : null;

    return delay(existing as T);
  }

  const created = {
    id: nextId('progress'),
    learnerId: user.id,
    lessonId,
    status: progressStatus,
    startedAt: status === 'not_started' ? null : timestamp,
    completedAt: status === 'completed' ? timestamp : null,
  };

  lessonProgressSeed.push(created);

  return delay(created as T);
}

export async function demoTrainingLaunch(
  token: string,
  trainingId: string
): Promise<TrainingLaunchResponse> {
  requireUserFromToken(token);

  const training = immersiveTrainingsSeed.find((record) => record.id === trainingId);

  if (!training) {
    throw new ApiError(404, 'Training not found');
  }

  const hasLaunchUrl = Boolean(training.launchUrl);

  return delay<TrainingLaunchResponse>({
    immersive_training_id: training.id,
    launch_type: training.launchType,
    launch_url: hasLaunchUrl ? training.launchUrl : null,
    enabled: training.enabled && hasLaunchUrl,
    unavailable_reason: training.enabled
      ? hasLaunchUrl
        ? null
        : 'O canal de execução deste treinamento não está configurado.'
      : 'Este treinamento ainda não foi liberado.',
    result_callback_url: `demo://results/${training.id}`,
    result_contract_version: '1.0-demo',
  });
}

export async function demoCreateUser<T>(token: string, payload: UserMutationPayload): Promise<T> {
  requireUserFromToken(token);

  if (usersSeed.some((record) => record.email.toLowerCase() === payload.email.toLowerCase())) {
    throw new ApiError(409, 'Email already exists');
  }

  const created: UserRecord = {
    id: nextId('user'),
    name: payload.name,
    email: payload.email,
    documentNumber: payload.documentNumber,
    sex: payload.sex,
    birthDate: payload.birthDate,
    role: payload.role,
    organizationId: payload.organizationId,
    organizationName: organizationNameFor(payload.organizationId),
    status: payload.status,
    lastAccessAt: null,
  };

  usersSeed.push(created);
  recalculateOrganizationCounters();

  return delay(created as T);
}

export async function demoUpdateUser<T>(
  token: string,
  userId: string,
  payload: UserMutationPayload
): Promise<T> {
  requireUserFromToken(token);

  const user = usersSeed.find((record) => record.id === userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const emailTaken = usersSeed.some(
    (record) => record.id !== userId && record.email.toLowerCase() === payload.email.toLowerCase()
  );

  if (emailTaken) {
    throw new ApiError(409, 'Email already exists');
  }

  user.name = payload.name;
  user.email = payload.email;
  user.documentNumber = payload.documentNumber;
  user.sex = payload.sex;
  user.birthDate = payload.birthDate;
  user.role = payload.role;
  user.organizationId = payload.organizationId;
  user.organizationName = organizationNameFor(payload.organizationId);
  user.status = payload.status;

  recalculateOrganizationCounters();

  return delay(user as T);
}

export async function demoDeactivateUser<T>(token: string, userId: string): Promise<T> {
  requireUserFromToken(token);

  const user = usersSeed.find((record) => record.id === userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.status = 'inactive';
  recalculateOrganizationCounters();

  return delay(user as T);
}

export async function demoCreateOrganization<T>(
  token: string,
  payload: OrganizationMutationPayload
): Promise<T> {
  requireUserFromToken(token);

  const documentTaken = organizationsSeed.some(
    (organization) =>
      payload.documentNumber && organization.documentNumber === payload.documentNumber
  );

  if (documentTaken) {
    throw new ApiError(409, 'Organization document already exists');
  }

  const created = {
    id: nextId('org'),
    name: payload.name,
    documentNumber: payload.documentNumber,
    ownerName: '',
    totalUsers: 0,
    activeModules: 0,
    status: payload.status,
  };

  organizationsSeed.push(created);

  return delay(created as T);
}

export async function demoUpdateOrganization<T>(
  token: string,
  organizationId: string,
  payload: OrganizationMutationPayload
): Promise<T> {
  requireUserFromToken(token);

  const organization = organizationsSeed.find((record) => record.id === organizationId);

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  organization.name = payload.name;
  organization.documentNumber = payload.documentNumber;
  organization.status = payload.status;

  for (const user of usersSeed) {
    if (user.organizationId === organizationId) {
      user.organizationName = organization.name;
    }
  }

  return delay(organization as T);
}

export async function demoDeactivateOrganization<T>(token: string, organizationId: string): Promise<T> {
  requireUserFromToken(token);

  const organization = organizationsSeed.find((record) => record.id === organizationId);

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  organization.status = 'inactive';

  return delay(organization as T);
}

export async function demoGrantOrganizationModuleAccess<T>(
  token: string,
  organizationId: string,
  moduleId: string
): Promise<T> {
  requireUserFromToken(token);

  const module = modulesSeed.find((record) => record.id === moduleId);

  if (!module) {
    throw new ApiError(404, 'Module not found');
  }

  if (!module.organizationIds.includes(organizationId)) {
    module.organizationIds.push(organizationId);
  }

  recalculateOrganizationCounters();

  return delay(module as T);
}

export async function demoRevokeOrganizationModuleAccess(
  token: string,
  organizationId: string,
  moduleId: string
): Promise<void> {
  requireUserFromToken(token);

  const module = modulesSeed.find((record) => record.id === moduleId);

  if (!module) {
    throw new ApiError(404, 'Module not found');
  }

  module.organizationIds = module.organizationIds.filter((id) => id !== organizationId);
  recalculateOrganizationCounters();

  return delay(undefined);
}

export async function demoCreateGroup<T>(token: string, payload: GroupMutationPayload): Promise<T> {
  requireUserFromToken(token);

  const codeTaken = studentGroupsSeed.some(
    (group) =>
      group.organizationId === payload.organizationId &&
      group.code.toLowerCase() === payload.code.toLowerCase()
  );

  if (codeTaken) {
    throw new ApiError(409, 'Group code already exists for this organization');
  }

  const created = {
    id: nextId('group'),
    organizationId: payload.organizationId,
    instructorId: payload.instructorId,
    name: payload.name,
    code: payload.code,
    description: payload.description,
    status: payload.status,
  };

  studentGroupsSeed.push(created);

  return delay(created as T);
}

export async function demoArchiveGroup<T>(token: string, groupId: string): Promise<T> {
  requireUserFromToken(token);

  const group = studentGroupsSeed.find((record) => record.id === groupId);

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  group.status = 'archived';

  return delay(group as T);
}

export async function demoAddGroupMembership<T>(
  token: string,
  groupId: string,
  learnerId: string,
  status: StudentGroupMembershipStatus
): Promise<T> {
  requireUserFromToken(token);

  if (!studentGroupsSeed.some((group) => group.id === groupId)) {
    throw new ApiError(404, 'Group not found');
  }

  if (!usersSeed.some((user) => user.id === learnerId && user.role === 'learner')) {
    throw new ApiError(404, 'Learner not found');
  }

  const alreadyActive = studentGroupMembershipsSeed.some(
    (membership) => membership.learnerId === learnerId && membership.status === 'active'
  );

  if (alreadyActive && status === 'active') {
    throw new ApiError(409, 'Learner already has an active group');
  }

  const created = {
    id: nextId('membership'),
    groupId,
    learnerId,
    status,
    startedAt: nowIso(),
    endedAt: null,
  };

  studentGroupMembershipsSeed.push(created);

  return delay(created as T);
}

export async function demoRemoveGroupMembership<T>(
  token: string,
  groupId: string,
  learnerId: string
): Promise<T> {
  requireUserFromToken(token);

  const index = studentGroupMembershipsSeed.findIndex(
    (membership) => membership.groupId === groupId && membership.learnerId === learnerId
  );

  if (index === -1) {
    throw new ApiError(404, 'Membership not found');
  }

  const [removed] = studentGroupMembershipsSeed.splice(index, 1);

  return delay(removed as T);
}

export async function demoAssignTrackToGroup<T>(
  token: string,
  groupId: string,
  trackId: string
): Promise<T> {
  const user = requireUserFromToken(token);

  if (!studyTracksSeed.some((track) => track.id === trackId)) {
    throw new ApiError(404, 'Track not found');
  }

  const existing = trackAssignmentsSeed.find(
    (assignment) => assignment.groupId === groupId && assignment.trackId === trackId
  );

  if (existing) {
    return delay(existing as T);
  }

  const created = {
    id: nextId('assignment'),
    groupId,
    trackId,
    assignedByUserId: user.id,
    assignedAt: nowIso(),
  };

  trackAssignmentsSeed.push(created);

  return delay(created as T);
}

export async function demoRemoveTrackAssignment(
  token: string,
  groupId: string,
  trackId: string
): Promise<void> {
  requireUserFromToken(token);

  const index = trackAssignmentsSeed.findIndex(
    (assignment) => assignment.groupId === groupId && assignment.trackId === trackId
  );

  if (index === -1) {
    throw new ApiError(404, 'Track assignment not found');
  }

  trackAssignmentsSeed.splice(index, 1);

  return delay(undefined);
}

function insertModule(payload: StudyModuleMutationPayload) {
  const created = {
    id: nextId('module'),
    name: payload.name,
    slug: payload.slug,
    summary: payload.summary,
    organizationIds: [] as string[],
    trainings: [],
  };

  modulesSeed.push(created);

  return created;
}

function insertTrack(payload: StudyTrackMutationPayload) {
  const created = {
    id: nextId('track'),
    moduleId: payload.moduleId,
    title: payload.title,
    slug: payload.slug,
    summary: payload.summary,
    level: payload.level,
    imageUrl: payload.imageUrl || undefined,
  };

  studyTracksSeed.push(created);

  return created;
}

function insertMaterial(payload: StudyMaterialMutationPayload) {
  const created = {
    id: nextId('material'),
    kind: payload.kind,
    title: payload.title,
    description: payload.description,
    url: payload.url,
    thumbnailUrl: payload.thumbnailUrl || undefined,
  };

  studyMaterialsSeed.push(created);

  return created;
}

function insertTraining(payload: ImmersiveTrainingMutationPayload) {
  const created = {
    id: nextId('immersive'),
    moduleId: payload.moduleId,
    title: payload.title,
    description: payload.description,
    minutes: payload.minutes,
    launchType: payload.launchType,
    launchUrl: payload.launchUrl,
    enabled: payload.enabled,
    imageUrl: payload.imageUrl || undefined,
    legacyTrainingId: payload.legacyTrainingId || undefined,
  };

  immersiveTrainingsSeed.push(created);

  return created;
}

function insertLesson(payload: StudyLessonMutationPayload) {
  const created = {
    id: nextId('lesson'),
    trackId: payload.trackId,
    order: payload.order,
    title: payload.title,
    description: payload.description,
    kind: payload.kind,
    required: payload.required,
    durationMinutes: payload.durationMinutes,
    materialId: payload.kind === 'study_material' ? payload.materialId : undefined,
    immersiveTrainingId:
      payload.kind === 'immersive_training' ? payload.immersiveTrainingId : undefined,
  };

  studyLessonsSeed.push(created);

  return created;
}

export async function demoCreateStudyModule<T>(
  token: string,
  payload: StudyModuleMutationPayload
): Promise<T> {
  requireUserFromToken(token);

  return delay(insertModule(payload) as T);
}

export async function demoCreateStudyTrack<T>(
  token: string,
  payload: StudyTrackMutationPayload
): Promise<T> {
  requireUserFromToken(token);

  return delay(insertTrack(payload) as T);
}

export async function demoCreateStudyMaterial<T>(
  token: string,
  payload: StudyMaterialMutationPayload
): Promise<T> {
  requireUserFromToken(token);

  return delay(insertMaterial(payload) as T);
}

export async function demoCreateImmersiveTraining<T>(
  token: string,
  payload: ImmersiveTrainingMutationPayload
): Promise<T> {
  requireUserFromToken(token);

  return delay(insertTraining(payload) as T);
}

export async function demoCreateStudyLesson<T>(
  token: string,
  payload: StudyLessonMutationPayload
): Promise<T> {
  requireUserFromToken(token);

  return delay(insertLesson(payload) as T);
}

export async function demoCreateStudyPackage<T>(
  token: string,
  payload: StudyPackageMutationPayload
): Promise<T> {
  requireUserFromToken(token);

  const moduleId =
    payload.moduleMode === 'existing' ? payload.moduleId : insertModule(payload.module).id;

  if (!modulesSeed.some((module) => module.id === moduleId)) {
    throw new ApiError(404, 'Module not found');
  }

  const track = insertTrack({ ...payload.track, moduleId });
  let order = 0;

  if (payload.includeMaterial) {
    const material = insertMaterial(payload.material);

    order += 1;
    insertLesson({
      trackId: track.id,
      order,
      title: payload.material.lessonTitle,
      description: payload.material.lessonDescription,
      kind: 'study_material',
      required: payload.material.required,
      durationMinutes: payload.material.durationMinutes,
      materialId: material.id,
      immersiveTrainingId: '',
    });
  }

  const training = insertTraining({ ...payload.training, moduleId });

  order += 1;
  insertLesson({
    trackId: track.id,
    order,
    title: payload.training.lessonTitle,
    description: payload.training.lessonDescription,
    kind: 'immersive_training',
    required: payload.training.required,
    durationMinutes: payload.training.durationMinutes,
    materialId: '',
    immersiveTrainingId: training.id,
  });

  return delay(track as T);
}
