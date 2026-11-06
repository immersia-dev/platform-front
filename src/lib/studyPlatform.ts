import {
  immersiveTrainingsSeed,
  lessonProgressSeed,
  modulesSeed,
  studyLessonsSeed,
  studyMaterialsSeed,
  studyTracksSeed,
  studentGroupMembershipsSeed,
  studentGroupsSeed,
  trackAssignmentsSeed,
  trainingAttemptsSeed,
  usersSeed,
  type AppRole,
  type ImmersiveTrainingRecord,
  type LessonProgressRecord,
  type LessonProgressStatus,
  type MaterialKind,
  type ModuleRecord,
  type StudyLessonRecord,
  type StudyMaterialRecord,
  type StudyTrackRecord,
  type StudentGroupRecord,
  type TrackAssignmentRecord,
  type UserRecord,
} from '../data/mockPlatform';

export type SessionActor = {
  email: string;
  role: AppRole;
  organizationId: string | null;
};

export type TrackProgressSummary = {
  requiredLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  percent: number;
  status: LessonProgressStatus;
};

export type GroupTrackProgressSummary = TrackProgressSummary & {
  learners: UserRecord[];
  completedLearners: number;
  inProgressLearners: number;
  pendingLearners: number;
};

export type TrackCatalogItem = {
  track: StudyTrackRecord;
  module: ModuleRecord;
  lessons: StudyLessonRecord[];
  durationMinutes: number;
  materialCount: number;
  trainingCount: number;
};

function getAverage(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getRequiredLessons(trackId: string) {
  return getTrackLessons(trackId).filter((lesson) => lesson.required);
}

function getStoredLessonProgress(
  learnerId: string,
  lessonId: string,
  progressRecords: LessonProgressRecord[]
) {
  return progressRecords.find(
    (record) => record.learnerId === learnerId && record.lessonId === lessonId
  );
}

function getTrainingAttemptForLesson(learnerId: string, lesson: StudyLessonRecord) {
  const training = lesson.immersiveTrainingId
    ? getImmersiveTrainingById(lesson.immersiveTrainingId)
    : null;

  if (!training?.legacyTrainingId) return null;

  return trainingAttemptsSeed.find(
    (attempt) =>
      attempt.learnerId === learnerId &&
      attempt.moduleId === training.moduleId &&
      attempt.trainingId === training.legacyTrainingId
  );
}

export function getCurrentUserRecord(actor: SessionActor | null): UserRecord | null {
  if (!actor) return null;
  return usersSeed.find((record) => record.email === actor.email) ?? null;
}

export function getLearnerActiveMembership(learnerId: string) {
  return (
    studentGroupMembershipsSeed.find(
      (membership) => membership.learnerId === learnerId && membership.status === 'active'
    ) ?? null
  );
}

export function getLearnerActiveGroup(learnerId: string) {
  const membership = getLearnerActiveMembership(learnerId);
  return studentGroupsSeed.find((group) => group.id === membership?.groupId) ?? null;
}

export function getScopedGroupsForUser(actor: SessionActor): StudentGroupRecord[] {
  const currentUser = getCurrentUserRecord(actor);

  if (actor.role === 'super_admin') {
    return studentGroupsSeed;
  }

  if (actor.role === 'org_admin') {
    return studentGroupsSeed.filter((group) => group.organizationId === actor.organizationId);
  }

  if (actor.role === 'instructor') {
    return studentGroupsSeed.filter(
      (group) => group.organizationId === actor.organizationId && group.instructorId === currentUser?.id
    );
  }

  const activeGroup = currentUser ? getLearnerActiveGroup(currentUser.id) : null;
  return activeGroup ? [activeGroup] : [];
}

export function canManageGroupTrackAssignments(actor: SessionActor, group: StudentGroupRecord) {
  const currentUser = getCurrentUserRecord(actor);

  if (actor.role === 'org_admin') {
    return group.organizationId === actor.organizationId;
  }

  if (actor.role === 'instructor') {
    return group.organizationId === actor.organizationId && group.instructorId === currentUser?.id;
  }

  return false;
}

export function getTrackById(trackId: string) {
  return studyTracksSeed.find((track) => track.id === trackId) ?? null;
}

export function getTrackModule(track: StudyTrackRecord) {
  return modulesSeed.find((module) => module.id === track.moduleId) ?? null;
}

export function getTrackLessons(trackId: string) {
  return studyLessonsSeed
    .filter((lesson) => lesson.trackId === trackId)
    .sort((left, right) => left.order - right.order);
}

export function getStudyMaterialById(materialId: string) {
  return studyMaterialsSeed.find((material) => material.id === materialId) ?? null;
}

export function getImmersiveTrainingById(trainingId: string) {
  return immersiveTrainingsSeed.find((training) => training.id === trainingId) ?? null;
}

export function getLessonMaterial(lesson: StudyLessonRecord): StudyMaterialRecord | null {
  return lesson.materialId ? getStudyMaterialById(lesson.materialId) : null;
}

export function getLessonImmersiveTraining(
  lesson: StudyLessonRecord
): ImmersiveTrainingRecord | null {
  return lesson.immersiveTrainingId ? getImmersiveTrainingById(lesson.immersiveTrainingId) : null;
}

export function getAvailableTracksForOrganization(organizationId: string | null) {
  if (!organizationId) return [];

  return studyTracksSeed.filter((track) => {
    const module = getTrackModule(track);
    return module?.organizationIds.includes(organizationId) ?? false;
  });
}

export function getAssignedTrackIdsForGroup(
  groupId: string,
  assignmentRecords: TrackAssignmentRecord[] = trackAssignmentsSeed
) {
  return assignmentRecords
    .filter((assignment) => assignment.groupId === groupId)
    .map((assignment) => assignment.trackId);
}

export function getAssignedTracksForGroup(
  groupId: string,
  assignmentRecords: TrackAssignmentRecord[] = trackAssignmentsSeed
) {
  const trackIds = new Set(getAssignedTrackIdsForGroup(groupId, assignmentRecords));
  return studyTracksSeed.filter((track) => trackIds.has(track.id));
}

export function getTrackCatalogItem(track: StudyTrackRecord): TrackCatalogItem | null {
  const module = getTrackModule(track);
  if (!module) return null;

  const lessons = getTrackLessons(track.id);

  return {
    track,
    module,
    lessons,
    durationMinutes: lessons.reduce((total, lesson) => total + lesson.durationMinutes, 0),
    materialCount: lessons.filter((lesson) => lesson.kind === 'study_material').length,
    trainingCount: lessons.filter((lesson) => lesson.kind === 'immersive_training').length,
  };
}

export function getTrackCatalogItems(tracks: StudyTrackRecord[]) {
  return tracks
    .map(getTrackCatalogItem)
    .filter((item): item is TrackCatalogItem => item !== null)
    .sort((left, right) => left.module.name.localeCompare(right.module.name));
}

export function getLessonProgressStatus(
  learnerId: string,
  lesson: StudyLessonRecord,
  progressRecords: LessonProgressRecord[] = lessonProgressSeed
): LessonProgressStatus {
  const storedProgress = getStoredLessonProgress(learnerId, lesson.id, progressRecords);

  if (storedProgress?.status === 'completed') {
    return 'completed';
  }

  if (lesson.kind === 'immersive_training' && getTrainingAttemptForLesson(learnerId, lesson)) {
    return 'completed';
  }

  return storedProgress?.status ?? 'not_started';
}

export function getLearnerTrackProgress(
  trackId: string,
  learnerId: string,
  progressRecords: LessonProgressRecord[] = lessonProgressSeed
): TrackProgressSummary {
  const requiredLessons = getRequiredLessons(trackId);
  const statuses = requiredLessons.map((lesson) =>
    getLessonProgressStatus(learnerId, lesson, progressRecords)
  );
  const completedLessons = statuses.filter((status) => status === 'completed').length;
  const inProgressLessons = statuses.filter((status) => status === 'in_progress').length;
  const percent = requiredLessons.length
    ? Math.round((completedLessons / requiredLessons.length) * 100)
    : 0;
  const status: LessonProgressStatus =
    percent === 100 ? 'completed' : inProgressLessons > 0 || completedLessons > 0 ? 'in_progress' : 'not_started';

  return {
    requiredLessons: requiredLessons.length,
    completedLessons,
    inProgressLessons,
    percent,
    status,
  };
}

export function getGroupLearners(groupId: string) {
  const learnerIds = new Set(
    studentGroupMembershipsSeed
      .filter((membership) => membership.groupId === groupId && membership.status === 'active')
      .map((membership) => membership.learnerId)
  );

  return usersSeed.filter((user) => user.role === 'learner' && learnerIds.has(user.id));
}

export function getGroupTrackProgress(
  groupId: string,
  trackId: string,
  progressRecords: LessonProgressRecord[] = lessonProgressSeed
): GroupTrackProgressSummary {
  const learners = getGroupLearners(groupId);
  const learnerProgress = learners.map((learner) =>
    getLearnerTrackProgress(trackId, learner.id, progressRecords)
  );
  const percent = getAverage(learnerProgress.map((progress) => progress.percent));
  const completedLearners = learnerProgress.filter((progress) => progress.percent === 100).length;
  const inProgressLearners = learnerProgress.filter(
    (progress) => progress.percent > 0 && progress.percent < 100
  ).length;
  const pendingLearners = Math.max(learners.length - completedLearners - inProgressLearners, 0);
  const requiredLessons = getRequiredLessons(trackId).length;
  const completedLessons = learnerProgress.reduce(
    (total, progress) => total + progress.completedLessons,
    0
  );
  const inProgressLessons = learnerProgress.reduce(
    (total, progress) => total + progress.inProgressLessons,
    0
  );
  const status: LessonProgressStatus =
    percent === 100 ? 'completed' : percent > 0 ? 'in_progress' : 'not_started';

  return {
    learners,
    completedLearners,
    inProgressLearners,
    pendingLearners,
    requiredLessons,
    completedLessons,
    inProgressLessons,
    percent,
    status,
  };
}

export function getGroupAverageTrackProgress(groupId: string) {
  const assignedTracks = getAssignedTracksForGroup(groupId);
  if (!assignedTracks.length) return 0;

  return getAverage(
    assignedTracks.map((track) => getGroupTrackProgress(groupId, track.id).percent)
  );
}

export function getLearnerAssignedTracks(actor: SessionActor) {
  const currentUser = getCurrentUserRecord(actor);
  if (!currentUser || actor.role !== 'learner') return [];

  const activeGroup = getLearnerActiveGroup(currentUser.id);
  if (!activeGroup) return [];

  const organizationTracks = getAvailableTracksForOrganization(activeGroup.organizationId);
  const organizationTrackIds = new Set(organizationTracks.map((track) => track.id));

  return getAssignedTracksForGroup(activeGroup.id).filter((track) => organizationTrackIds.has(track.id));
}

export function getNextLessonForLearner(
  trackId: string,
  learnerId: string,
  progressRecords: LessonProgressRecord[] = lessonProgressSeed
) {
  const lessons = getTrackLessons(trackId);
  return (
    lessons.find(
      (lesson) => getLessonProgressStatus(learnerId, lesson, progressRecords) !== 'completed'
    ) ?? lessons[0] ?? null
  );
}

export function getMaterialKindLabel(kind: MaterialKind) {
  if (kind === 'pdf') return 'PDF';
  if (kind === 'video') return 'Vídeo';
  if (kind === 'image') return 'Imagem';
  return 'Link';
}

export function getLaunchTypeLabel(launchType: ImmersiveTrainingRecord['launchType']) {
  return launchType === 'meta_app' ? 'Meta Quest (app Immersia)' : 'Navegador (web)';
}

/**
 * Um módulo fica "Em breve" enquanto não tiver nenhum treinamento habilitado —
 * é assim que NR-10 e NR-33 aparecem no catálogo até o lançamento.
 */
export function isModuleComingSoon(moduleId: string) {
  const module = modulesSeed.find((record) => record.id === moduleId);
  const hasEnabledImmersive = immersiveTrainingsSeed.some(
    (training) => training.moduleId === moduleId && training.enabled
  );
  const hasEnabledLegacy = module?.trainings.some((training) => training.enabled !== false) ?? false;

  return !hasEnabledImmersive && !hasEnabledLegacy;
}

/** Contagens únicas do catálogo, usadas por todas as telas que resumem o catálogo. */
export function getCatalogSummary() {
  const comingSoonModuleIds = new Set(
    modulesSeed.filter((module) => isModuleComingSoon(module.id)).map((module) => module.id)
  );
  const availableTrainings = immersiveTrainingsSeed.filter(
    (training) => training.enabled && !comingSoonModuleIds.has(training.moduleId)
  );

  return {
    modules: modulesSeed.length,
    activeModules: modulesSeed.length - comingSoonModuleIds.size,
    comingSoonModules: comingSoonModuleIds.size,
    tracks: studyTracksSeed.length,
    lessons: studyLessonsSeed.length,
    trainings: immersiveTrainingsSeed.length,
    availableTrainings: availableTrainings.length,
    comingSoonTrainings: immersiveTrainingsSeed.length - availableTrainings.length,
  };
}

export function getModuleTrainingCount(moduleId: string) {
  return immersiveTrainingsSeed.filter((training) => training.moduleId === moduleId).length;
}

export function getTrainingStudyProgress(moduleId: string, legacyTrainingId: string) {
  const relatedTrainingIds = new Set(
    immersiveTrainingsSeed
      .filter(
        (training) =>
          training.moduleId === moduleId && training.legacyTrainingId === legacyTrainingId
      )
      .map((training) => training.id)
  );
  const relatedLessons = studyLessonsSeed.filter(
    (lesson) => lesson.immersiveTrainingId && relatedTrainingIds.has(lesson.immersiveTrainingId)
  );
  const relatedTracks = studyTracksSeed.filter((track) =>
    relatedLessons.some((lesson) => lesson.trackId === track.id)
  );

  if (!relatedTracks.length) {
    return {
      relatedTracks,
      averageProgress: 0,
      completedLearners: 0,
      totalLearners: 0,
    };
  }

  const learnerIds = new Set<string>();
  relatedTracks.forEach((track) => {
    trackAssignmentsSeed
      .filter((assignment) => assignment.trackId === track.id)
      .forEach((assignment) => {
        getGroupLearners(assignment.groupId).forEach((learner) => learnerIds.add(learner.id));
      });
  });

  const learners = usersSeed.filter((user) => learnerIds.has(user.id));
  const learnerProgress = learners.map((learner) => {
    const trackProgresses = relatedTracks.map((track) =>
      getLearnerTrackProgress(track.id, learner.id)
    );
    return getAverage(trackProgresses.map((progress) => progress.percent));
  });

  return {
    relatedTracks,
    averageProgress: getAverage(learnerProgress),
    completedLearners: learnerProgress.filter((percent) => percent === 100).length,
    totalLearners: learners.length,
  };
}
