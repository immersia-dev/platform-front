import {
  immersiveTrainingsSeed,
  lessonProgressSeed,
  modulesSeed,
  organizationsSeed,
  studyLessonsSeed,
  studyMaterialsSeed,
  studyTracksSeed,
  studentGroupMembershipsSeed,
  studentGroupModuleAccessSeed,
  studentGroupsSeed,
  trackAssignmentsSeed,
  trainingAttemptsSeed,
  usersSeed,
  type ImmersiveTrainingRecord,
  type LessonProgressRecord,
  type ModuleRecord,
  type OrganizationRecord,
  type StudyLessonRecord,
  type StudyMaterialRecord,
  type StudyTrackRecord,
  type StudentGroupMembershipRecord,
  type StudentGroupModuleAccessRecord,
  type StudentGroupRecord,
  type TrackAssignmentRecord,
  type TrainingAttemptRecord,
  type UserRecord,
} from './mockPlatform';

export type PlatformSnapshot = {
  organizations: OrganizationRecord[];
  users: UserRecord[];
  studentGroups: StudentGroupRecord[];
  studentGroupMemberships: StudentGroupMembershipRecord[];
  studentGroupModuleAccess: StudentGroupModuleAccessRecord[];
  modules: ModuleRecord[];
  studyMaterials: StudyMaterialRecord[];
  immersiveTrainings: ImmersiveTrainingRecord[];
  studyTracks: StudyTrackRecord[];
  studyLessons: StudyLessonRecord[];
  trackAssignments: TrackAssignmentRecord[];
  lessonProgress: LessonProgressRecord[];
  trainingAttempts: TrainingAttemptRecord[];
};

function replaceRecords<T>(target: T[], source: T[]) {
  target.splice(0, target.length, ...source);
}

export function applyPlatformSnapshot(snapshot: PlatformSnapshot) {
  replaceRecords(organizationsSeed, snapshot.organizations);
  replaceRecords(usersSeed, snapshot.users);
  replaceRecords(studentGroupsSeed, snapshot.studentGroups);
  replaceRecords(studentGroupMembershipsSeed, snapshot.studentGroupMemberships);
  replaceRecords(studentGroupModuleAccessSeed, snapshot.studentGroupModuleAccess);
  replaceRecords(modulesSeed, snapshot.modules);
  replaceRecords(studyMaterialsSeed, snapshot.studyMaterials);
  replaceRecords(immersiveTrainingsSeed, snapshot.immersiveTrainings);
  replaceRecords(studyTracksSeed, snapshot.studyTracks);
  replaceRecords(studyLessonsSeed, snapshot.studyLessons);
  replaceRecords(trackAssignmentsSeed, snapshot.trackAssignments);
  replaceRecords(lessonProgressSeed, snapshot.lessonProgress);
  replaceRecords(trainingAttemptsSeed, snapshot.trainingAttempts);
}
