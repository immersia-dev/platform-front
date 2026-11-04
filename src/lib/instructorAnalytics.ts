import {
  modulesSeed,
  studentGroupMembershipsSeed,
  studentGroupsSeed,
  trainingAttemptsSeed,
  usersSeed,
  type ModuleRecord,
  type StudentGroupRecord,
  type TrainingAttemptRecord,
  type TrainingRecord,
  type UserRecord,
} from '../data/mockPlatform';

export type RiskLevel = 'critical' | 'attention' | 'healthy';

export type AttemptDetails = {
  attempt: TrainingAttemptRecord;
  learnerName: string;
  groupName: string;
  groupCode: string;
  moduleName: string;
  trainingTitle: string;
  accuracyRate: number;
  report: string;
};

export type LearnerAnalytics = {
  learner: UserRecord;
  attempts: TrainingAttemptRecord[];
  averageScore: number;
  averageResponseTime: number;
  totalCriticalErrors: number;
  totalHintsUsed: number;
  approvedTrainings: number;
  approvalRate: number;
  bestScore: number;
  worstScore: number;
  lastActivity: string | null;
  risk: RiskLevel;
};

export type ModuleAnalytics = {
  module: ModuleRecord;
  attempts: TrainingAttemptRecord[];
  averageScore: number;
  averageResponseTime: number;
  approvalRate: number;
  learnersReached: number;
};

export type GroupAnalytics = {
  group: StudentGroupRecord;
  learners: UserRecord[];
  attempts: TrainingAttemptRecord[];
  averageScore: number;
  averageResponseTime: number;
  approvalRate: number;
  participationRate: number;
  attemptedLearners: number;
  pendingLearners: number;
  learnersNeedingSupport: number;
  learningGain: number;
  latestActivity: string | null;
  trendPoints: TrendPoint[];
  risk: RiskLevel;
};

export type TrendPoint = {
  key: string;
  label: string;
  attempts: number;
  averageScore: number;
  approvalRate: number;
};

export type DistributionBand = {
  label: string;
  hint: string;
  count: number;
  percentage: number;
  risk: RiskLevel;
};

export type LearnerSpotlight = {
  learnerId: string;
  learnerName: string;
  averageScore: number;
  attempts: number;
  responseTime: number;
  approvalRate: number;
  risk: RiskLevel;
};

export type LearnerDetails = {
  summary: LearnerAnalytics;
  attempts: AttemptDetails[];
  modulePerformance: Array<{
    moduleId: string;
    moduleName: string;
    attempts: number;
    averageScore: number;
    bestScore: number;
    averageResponseTime: number;
  }>;
  scoreTimeline: Array<{
    label: string;
    score: number;
    accuracyRate: number;
    responseTimeMinutes: number;
  }>;
};

export type TrainingGroupResult = {
  group: StudentGroupRecord;
  attempts: TrainingAttemptRecord[];
  learners: UserRecord[];
  attemptedLearners: number;
  pendingLearners: number;
  averageScore: number;
  approvalRate: number;
  averageResponseTime: number;
  criticalErrors: number;
  hintsUsed: number;
  learningGain: number;
  risk: RiskLevel;
};

export type TrainingLearnerResult = {
  learner: UserRecord;
  attempts: TrainingAttemptRecord[];
  latestAttempt: TrainingAttemptRecord | null;
  averageScore: number;
  averageAccuracy: number;
  averageResponseTime: number;
  approvalRate: number;
  bestScore: number;
  risk: RiskLevel;
  status: 'approved' | 'needs_attention' | 'not_started';
};

export type TrainingDetails = {
  module: ModuleRecord;
  training: TrainingRecord;
  attempts: AttemptDetails[];
  learners: TrainingLearnerResult[];
  groupPerformance: TrainingGroupResult[];
  trendPoints: TrendPoint[];
  distributionBands: DistributionBand[];
  totalLearners: number;
  attemptedLearners: number;
  approvedLearners: number;
  pendingLearners: number;
  learnersNeedingAttention: number;
  averageScore: number;
  averageAccuracy: number;
  averageResponseTime: number;
  totalCriticalErrors: number;
  totalHintsUsed: number;
  approvalRate: number;
  bestScore: number;
};

function getAverage(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number) {
  return Math.round(value);
}

function getAttemptAccuracy(attempt: TrainingAttemptRecord) {
  if (!attempt.totalQuestions) return 0;
  return round((attempt.correctAnswers / attempt.totalQuestions) * 100);
}

function sortAttemptsDesc(left: TrainingAttemptRecord, right: TrainingAttemptRecord) {
  return new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime();
}

function sortAttemptsAsc(left: TrainingAttemptRecord, right: TrainingAttemptRecord) {
  return new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime();
}

export function formatDateTime(value: string | null) {
  if (!value) return 'Sem atividade';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export function getRiskLevel(score: number): RiskLevel {
  if (score < 70) return 'critical';
  if (score < 80) return 'attention';
  return 'healthy';
}

export function getRiskLabel(risk: RiskLevel) {
  if (risk === 'critical') return 'Crítico';
  if (risk === 'attention') return 'Atenção';
  return 'Saudável';
}

export function getRiskPillClass(risk: RiskLevel) {
  if (risk === 'critical') {
    return 'status-pill border-rose-300/20 bg-rose-400/10 text-rose-100';
  }

  if (risk === 'attention') {
    return 'status-pill border-amber-300/20 bg-amber-400/10 text-amber-100';
  }

  return 'status-pill status-pill-success';
}

function getAttemptDetails(attempt: TrainingAttemptRecord): AttemptDetails {
  const learner = usersSeed.find((record) => record.id === attempt.learnerId);
  const group = studentGroupsSeed.find((record) => record.id === attempt.groupId);
  const module = modulesSeed.find((record) => record.id === attempt.moduleId);
  const training = module?.trainings.find((record) => record.id === attempt.trainingId);

  return {
    attempt,
    learnerName: learner?.name ?? 'Aluno',
    groupName: group?.name ?? 'Turma',
    groupCode: group?.code ?? 'Sem código',
    moduleName: module?.name ?? 'Módulo',
    trainingTitle: training?.title ?? 'Treinamento',
    accuracyRate: getAttemptAccuracy(attempt),
    report: attempt.report,
  };
}

function getLearnerAnalytics(learner: UserRecord, attempts: TrainingAttemptRecord[]): LearnerAnalytics {
  const sortedAttempts = [...attempts].sort(sortAttemptsDesc);
  const scores = sortedAttempts.map((attempt) => attempt.score);
  const averageScore = round(getAverage(scores));
  const approvalRate = sortedAttempts.length
    ? round(
        (sortedAttempts.filter((attempt) => attempt.outcome === 'approved').length / sortedAttempts.length) *
          100
      )
    : 0;
  const approvedTrainings = new Set(
    sortedAttempts.filter((attempt) => attempt.outcome === 'approved').map((attempt) => attempt.trainingId)
  ).size;

  return {
    learner,
    attempts: sortedAttempts,
    averageScore,
    averageResponseTime: round(getAverage(sortedAttempts.map((attempt) => attempt.responseTimeMinutes))),
    totalCriticalErrors: sortedAttempts.reduce((total, attempt) => total + attempt.criticalErrors, 0),
    totalHintsUsed: sortedAttempts.reduce((total, attempt) => total + attempt.hintsUsed, 0),
    approvedTrainings,
    approvalRate,
    bestScore: scores.length ? Math.max(...scores) : 0,
    worstScore: scores.length ? Math.min(...scores) : 0,
    lastActivity: sortedAttempts[0]?.completedAt ?? null,
    risk: getRiskLevel(averageScore || 0),
  };
}

function buildTrendPoints(attempts: TrainingAttemptRecord[]): TrendPoint[] {
  if (!attempts.length) return [];

  const latestTimestamp = Math.max(...attempts.map((attempt) => new Date(attempt.completedAt).getTime()));
  const latestDate = new Date(latestTimestamp);
  latestDate.setHours(0, 0, 0, 0);

  const points: TrendPoint[] = [];

  for (let index = 6; index >= 0; index -= 1) {
    const currentDate = new Date(latestDate);
    currentDate.setDate(latestDate.getDate() - index);

    const start = new Date(currentDate);
    const end = new Date(currentDate);
    end.setDate(currentDate.getDate() + 1);

    const pointAttempts = attempts.filter((attempt) => {
      const completedAt = new Date(attempt.completedAt).getTime();
      return completedAt >= start.getTime() && completedAt < end.getTime();
    });

    const approvalRate = pointAttempts.length
      ? round(
          (pointAttempts.filter((attempt) => attempt.outcome === 'approved').length / pointAttempts.length) *
            100
        )
      : 0;

    points.push({
      key: start.toISOString(),
      label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(start),
      attempts: pointAttempts.length,
      averageScore: round(getAverage(pointAttempts.map((attempt) => attempt.score))),
      approvalRate,
    });
  }

  return points;
}

function buildDistributionBands(attempts: TrainingAttemptRecord[]): DistributionBand[] {
  const total = attempts.length || 1;
  const ranges = [
    {
      label: 'Saudável',
      hint: '90% ou mais',
      risk: 'healthy' as RiskLevel,
      predicate: (score: number) => score >= 90,
    },
    {
      label: 'Consistente',
      hint: '80% a 89%',
      risk: 'healthy' as RiskLevel,
      predicate: (score: number) => score >= 80 && score < 90,
    },
    {
      label: 'Atenção',
      hint: '70% a 79%',
      risk: 'attention' as RiskLevel,
      predicate: (score: number) => score >= 70 && score < 80,
    },
    {
      label: 'Crítico',
      hint: 'Abaixo de 70%',
      risk: 'critical' as RiskLevel,
      predicate: (score: number) => score < 70,
    },
  ];

  return ranges.map((range) => {
    const count = attempts.filter((attempt) => range.predicate(attempt.score)).length;
    return {
      label: range.label,
      hint: range.hint,
      count,
      percentage: round((count / total) * 100),
      risk: range.risk,
    };
  });
}

function getLearningGain(attempts: TrainingAttemptRecord[]) {
  const learnerIds = [...new Set(attempts.map((attempt) => attempt.learnerId))];
  const gains = learnerIds
    .map((learnerId) => {
      const learnerAttempts = attempts
        .filter((attempt) => attempt.learnerId === learnerId)
        .sort(sortAttemptsAsc);

      if (learnerAttempts.length < 2) return null;

      return learnerAttempts[learnerAttempts.length - 1].score - learnerAttempts[0].score;
    })
    .filter((gain): gain is number => gain !== null);

  return round(getAverage(gains));
}

function getGroupRisk(
  averageScore: number,
  participationRate: number,
  learnersNeedingSupport: number
): RiskLevel {
  if (averageScore < 70 || participationRate < 50) return 'critical';
  if (averageScore < 80 || participationRate < 80 || learnersNeedingSupport > 0) return 'attention';
  return 'healthy';
}

export function getInstructorAnalytics(organizationId: string) {
  const learners = usersSeed.filter(
    (record) => record.organizationId === organizationId && record.role === 'learner'
  );
  const learnerIds = new Set(learners.map((record) => record.id));
  const attempts = trainingAttemptsSeed
    .filter((record) => record.organizationId === organizationId && learnerIds.has(record.learnerId))
    .sort(sortAttemptsDesc);
  const visibleModules = modulesSeed.filter((module) => module.organizationIds.includes(organizationId));
  const activeGroups = studentGroupsSeed.filter(
    (group) => group.organizationId === organizationId && group.status === 'active'
  );
  const activeMemberships = studentGroupMembershipsSeed.filter((membership) => membership.status === 'active');

  const learnersWithMetrics = learners
    .map((learner) =>
      getLearnerAnalytics(
        learner,
        attempts.filter((attempt) => attempt.learnerId === learner.id)
      )
    )
    .sort((left, right) => left.averageScore - right.averageScore);

  const modulePerformance: ModuleAnalytics[] = visibleModules.map((module) => {
    const moduleAttempts = attempts.filter((attempt) => attempt.moduleId === module.id);

    return {
      module,
      attempts: moduleAttempts,
      averageScore: round(getAverage(moduleAttempts.map((attempt) => attempt.score))),
      averageResponseTime: round(getAverage(moduleAttempts.map((attempt) => attempt.responseTimeMinutes))),
      approvalRate: moduleAttempts.length
        ? round(
            (moduleAttempts.filter((attempt) => attempt.outcome === 'approved').length / moduleAttempts.length) *
              100
          )
        : 0,
      learnersReached: new Set(moduleAttempts.map((attempt) => attempt.learnerId)).size,
    };
  });

  const groupPerformance: GroupAnalytics[] = activeGroups.map((group) => {
    const groupLearnerIds = new Set(
      activeMemberships
        .filter((membership) => membership.groupId === group.id)
        .map((membership) => membership.learnerId)
    );
    const groupLearners = learners.filter((learner) => groupLearnerIds.has(learner.id));
    const groupAttempts = attempts.filter((attempt) => attempt.groupId === group.id);
    const groupLearnersWithMetrics = groupLearners.map((learner) =>
      getLearnerAnalytics(
        learner,
        groupAttempts.filter((attempt) => attempt.learnerId === learner.id)
      )
    );
    const attemptedLearners = new Set(groupAttempts.map((attempt) => attempt.learnerId)).size;
    const participationRate = groupLearners.length
      ? round((attemptedLearners / groupLearners.length) * 100)
      : 0;
    const averageScore = round(getAverage(groupAttempts.map((attempt) => attempt.score)));
    const approvalRate = groupAttempts.length
      ? round(
          (groupAttempts.filter((attempt) => attempt.outcome === 'approved').length /
            groupAttempts.length) *
            100
        )
      : 0;
    const learnersNeedingSupport = groupLearnersWithMetrics.filter(
      (item) => item.attempts.length > 0 && item.risk !== 'healthy'
    ).length;

    return {
      group,
      learners: groupLearners,
      attempts: groupAttempts,
      averageScore,
      averageResponseTime: round(getAverage(groupAttempts.map((attempt) => attempt.responseTimeMinutes))),
      approvalRate,
      participationRate,
      attemptedLearners,
      pendingLearners: Math.max(groupLearners.length - attemptedLearners, 0),
      learnersNeedingSupport,
      learningGain: getLearningGain(groupAttempts),
      latestActivity: groupAttempts[0]?.completedAt ?? null,
      trendPoints: buildTrendPoints(groupAttempts),
      risk: getGroupRisk(averageScore, participationRate, learnersNeedingSupport),
    };
  });

  const recentAttempts = attempts.slice(0, 8).map(getAttemptDetails);
  const trendPoints = buildTrendPoints(attempts);
  const distributionBands = buildDistributionBands(attempts);
  const overallApprovalRate = attempts.length
    ? round((attempts.filter((attempt) => attempt.outcome === 'approved').length / attempts.length) * 100)
    : 0;
  const classAverage = round(getAverage(learnersWithMetrics.map((item) => item.averageScore)));
  const averageResponseTime = round(getAverage(attempts.map((attempt) => attempt.responseTimeMinutes)));
  const learnersNeedingAttention = learnersWithMetrics.filter((item) => item.risk !== 'healthy');
  const learnerSpotlights: LearnerSpotlight[] = learnersWithMetrics.map((item) => ({
    learnerId: item.learner.id,
    learnerName: item.learner.name,
    averageScore: item.averageScore,
    attempts: item.attempts.length,
    responseTime: item.averageResponseTime,
    approvalRate: item.approvalRate,
    risk: item.risk,
  }));

  return {
    learners,
    attempts,
    learnersWithMetrics,
    modulePerformance,
    groupPerformance,
    recentAttempts,
    trendPoints,
    distributionBands,
    classAverage,
    overallApprovalRate,
    averageResponseTime,
    learnersNeedingAttention,
    learnerSpotlights,
  };
}

export function getLearnerDetails(organizationId: string, learnerId: string): LearnerDetails | null {
  const learner = usersSeed.find(
    (record) =>
      record.organizationId === organizationId &&
      record.role === 'learner' &&
      record.id === learnerId
  );

  if (!learner) return null;

  const attempts = trainingAttemptsSeed
    .filter((record) => record.organizationId === organizationId && record.learnerId === learnerId)
    .sort(sortAttemptsDesc);

  const summary = getLearnerAnalytics(learner, attempts);

  const attemptsWithDetails = attempts.map(getAttemptDetails);
  const modulePerformance = modulesSeed
    .filter((module) => module.organizationIds.includes(organizationId))
    .map((module) => {
      const moduleAttempts = attempts.filter((attempt) => attempt.moduleId === module.id);
      return {
        moduleId: module.id,
        moduleName: module.name,
        attempts: moduleAttempts.length,
        averageScore: round(getAverage(moduleAttempts.map((attempt) => attempt.score))),
        bestScore: moduleAttempts.length ? Math.max(...moduleAttempts.map((attempt) => attempt.score)) : 0,
        averageResponseTime: round(getAverage(moduleAttempts.map((attempt) => attempt.responseTimeMinutes))),
      };
    })
    .filter((module) => module.attempts > 0);

  const scoreTimeline = [...attempts]
    .sort(sortAttemptsAsc)
    .map((attempt, index) => ({
      label: `T${index + 1}`,
      score: attempt.score,
      accuracyRate: getAttemptAccuracy(attempt),
      responseTimeMinutes: attempt.responseTimeMinutes,
    }));

  return {
    summary,
    attempts: attemptsWithDetails,
    modulePerformance,
    scoreTimeline,
  };
}

export function getTrainingDetails(
  organizationId: string | null,
  moduleId: string,
  trainingId: string
): TrainingDetails | null {
  const module = modulesSeed.find((record) =>
    organizationId
      ? record.id === moduleId && record.organizationIds.includes(organizationId)
      : record.id === moduleId
  );
  const training = module?.trainings.find((record) => record.id === trainingId);

  if (!module || !training) return null;

  const scopedOrganizationIds = organizationId ? [organizationId] : module.organizationIds;
  const learners = usersSeed.filter(
    (record) =>
      record.organizationId !== null &&
      scopedOrganizationIds.includes(record.organizationId) &&
      record.role === 'learner'
  );
  const learnerIds = new Set(learners.map((record) => record.id));
  const activeGroups = studentGroupsSeed.filter(
    (group) => scopedOrganizationIds.includes(group.organizationId) && group.status === 'active'
  );
  const activeMemberships = studentGroupMembershipsSeed.filter((membership) => membership.status === 'active');
  const attempts = trainingAttemptsSeed
    .filter(
      (record) =>
        scopedOrganizationIds.includes(record.organizationId) &&
        record.moduleId === moduleId &&
        record.trainingId === trainingId &&
        learnerIds.has(record.learnerId)
    )
    .sort(sortAttemptsDesc);

  const attemptsWithDetails = attempts.map(getAttemptDetails);
  const groupPerformance: TrainingGroupResult[] = activeGroups.map((group) => {
    const groupLearnerIds = new Set(
      activeMemberships
        .filter((membership) => membership.groupId === group.id)
        .map((membership) => membership.learnerId)
    );
    const groupLearners = learners.filter((learner) => groupLearnerIds.has(learner.id));
    const groupAttempts = attempts.filter((attempt) => attempt.groupId === group.id);
    const attemptedLearners = new Set(groupAttempts.map((attempt) => attempt.learnerId)).size;
    const averageScore = round(getAverage(groupAttempts.map((attempt) => attempt.score)));
    const participationRate = groupLearners.length
      ? round((attemptedLearners / groupLearners.length) * 100)
      : 0;
    const learnersNeedingSupport = groupLearners.filter((learner) => {
      const learnerAttempts = groupAttempts.filter((attempt) => attempt.learnerId === learner.id);
      if (!learnerAttempts.length) return false;
      return getLearnerAnalytics(learner, learnerAttempts).risk !== 'healthy';
    }).length;

    return {
      group,
      attempts: groupAttempts,
      learners: groupLearners,
      attemptedLearners,
      pendingLearners: Math.max(groupLearners.length - attemptedLearners, 0),
      averageScore,
      approvalRate: groupAttempts.length
        ? round(
            (groupAttempts.filter((attempt) => attempt.outcome === 'approved').length /
              groupAttempts.length) *
              100
          )
        : 0,
      averageResponseTime: round(getAverage(groupAttempts.map((attempt) => attempt.responseTimeMinutes))),
      criticalErrors: groupAttempts.reduce((total, attempt) => total + attempt.criticalErrors, 0),
      hintsUsed: groupAttempts.reduce((total, attempt) => total + attempt.hintsUsed, 0),
      learningGain: getLearningGain(groupAttempts),
      risk: getGroupRisk(averageScore, participationRate, learnersNeedingSupport),
    };
  });
  const learnersWithResults: TrainingLearnerResult[] = learners
    .map((learner) => {
      const learnerAttempts = attempts
        .filter((attempt) => attempt.learnerId === learner.id)
        .sort(sortAttemptsDesc);
      const scores = learnerAttempts.map((attempt) => attempt.score);
      const latestAttempt = learnerAttempts[0] ?? null;
      const averageScore = round(getAverage(scores));
      const approvalRate = learnerAttempts.length
        ? round(
            (learnerAttempts.filter((attempt) => attempt.outcome === 'approved').length /
              learnerAttempts.length) *
              100
          )
        : 0;
      const status: TrainingLearnerResult['status'] = !latestAttempt
        ? 'not_started'
        : latestAttempt.outcome === 'approved'
          ? 'approved'
          : 'needs_attention';

      return {
        learner,
        attempts: learnerAttempts,
        latestAttempt,
        averageScore,
        averageAccuracy: round(getAverage(learnerAttempts.map(getAttemptAccuracy))),
        averageResponseTime: round(
          getAverage(learnerAttempts.map((attempt) => attempt.responseTimeMinutes))
        ),
        approvalRate,
        bestScore: scores.length ? Math.max(...scores) : 0,
        risk: getRiskLevel(averageScore || 0),
        status,
      };
    })
    .sort((left, right) => {
      if (left.status === 'not_started' && right.status !== 'not_started') return 1;
      if (right.status === 'not_started' && left.status !== 'not_started') return -1;
      return left.averageScore - right.averageScore;
    });

  const attemptedLearners = new Set(attempts.map((attempt) => attempt.learnerId)).size;
  const approvedLearners = learnersWithResults.filter((item) => item.status === 'approved').length;
  const learnersNeedingAttention = learnersWithResults.filter(
    (item) => item.status === 'needs_attention'
  ).length;

  return {
    module,
    training,
    attempts: attemptsWithDetails,
    learners: learnersWithResults,
    groupPerformance,
    trendPoints: buildTrendPoints(attempts),
    distributionBands: buildDistributionBands(attempts),
    totalLearners: learners.length,
    attemptedLearners,
    approvedLearners,
    pendingLearners: Math.max(learners.length - attemptedLearners, 0),
    learnersNeedingAttention,
    averageScore: round(getAverage(attempts.map((attempt) => attempt.score))),
    averageAccuracy: round(getAverage(attempts.map(getAttemptAccuracy))),
    averageResponseTime: round(getAverage(attempts.map((attempt) => attempt.responseTimeMinutes))),
    totalCriticalErrors: attempts.reduce((total, attempt) => total + attempt.criticalErrors, 0),
    totalHintsUsed: attempts.reduce((total, attempt) => total + attempt.hintsUsed, 0),
    approvalRate: attempts.length
      ? round((attempts.filter((attempt) => attempt.outcome === 'approved').length / attempts.length) * 100)
      : 0,
    bestScore: attempts.length ? Math.max(...attempts.map((attempt) => attempt.score)) : 0,
  };
}
