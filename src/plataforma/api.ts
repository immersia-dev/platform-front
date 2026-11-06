/**
 * Cliente da API da plataforma (platform-back, /api/v1).
 *
 * Usado quando o front roda contra o back real (VITE_API_URL definido). O modo demonstração
 * (vitrine do site) continua com os dados simulados de lib/demoApi.
 */
import type { AppRole } from '../data/mockPlatform';
import { ApiError } from '../lib/apiError';

export const API_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'
).replace(/\/$/, '');

export type BackRole =
  'platform_admin' | 'company_admin' | 'instructor' | 'student';

export const roleFromBack: Record<BackRole, AppRole> = {
  platform_admin: 'super_admin',
  company_admin: 'org_admin',
  instructor: 'instructor',
  student: 'learner',
};

export const roleToBack: Record<AppRole, BackRole> = {
  super_admin: 'platform_admin',
  org_admin: 'company_admin',
  instructor: 'instructor',
  learner: 'student',
};

export const roleNames: Record<BackRole, string> = {
  platform_admin: 'Equipe Immersia',
  company_admin: 'Gestor',
  instructor: 'Instrutor',
  student: 'Aluno',
};

export type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  active: boolean;
  created_at: string;
};
export type User = {
  id: string;
  company_id: string | null;
  name: string;
  email: string | null;
  cpf: string | null;
  role: BackRole;
  active: boolean;
  must_change_password: boolean;
};
export type Classroom = {
  id: string;
  company_id: string;
  name: string;
  instructor_ids: string[];
  archived_at: string | null;
};
export type Enrollment = {
  id: string;
  company_id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
  ended_at: string | null;
};
export type Course = {
  id: string;
  title: string;
  description: string | null;
  validity_months: number | null;
  workload_hours: string | null;
  syllabus: string | null;
  technical_lead: string | null;
  /** Caminho da foto de capa em /api/v1 (pública); null = sem capa. */
  cover_url: string | null;
  published_at: string | null;
  archived_at: string | null;
};
export type CompanyCourse = {
  company_id: string;
  course_id: string;
  granted_at: string;
  revoked_at: string | null;
};
export type LessonType = 'material' | 'vr_training' | 'quiz';
export type MaterialKind = 'text' | 'pdf' | 'video' | 'image' | 'link';

/** Pergunta do quiz. `correct` e `explanation` só chegam para a Immersia (quem escreve o quiz). */
export type QuizQuestion = {
  id: string;
  text: string;
  multiple?: boolean;
  options: { id: string; text: string }[];
  correct?: string[];
  explanation?: string | null;
};
export type Quiz = { questions: QuizQuestion[] };

export type Lesson = {
  id: string;
  course_id: string;
  position: number;
  title: string;
  type: LessonType;
  material_kind: MaterialKind | null;
  material_key: string | null;
  unity_key: string | null;
  content_version: string;
  min_app_version: string | null;
  passing_score: string | null;
  max_critical_errors: number | null;
  /** Texto da etapa (markdown simples) ou uma observação curta. */
  body: string | null;
  duration_minutes: number | null;
  quiz: Quiz | null;
  /** Nome da apostila enviada (null = sem arquivo). */
  file_name: string | null;
};

/** GET /lessons/{id}/content: a etapa para estudar, com o link assinado (1 h) da apostila. */
export type LessonContent = Lesson & {
  file_url: string | null;
  file_size: number | null;
};

export type QuizResult = {
  number: number | null;
  score: string;
  passed: boolean;
  correct: number;
  total: number;
  passing_score: string;
  completed: boolean;
  questions: {
    id: string;
    right: boolean;
    chosen: string[];
    correct: string[];
    explanation: string | null;
  }[];
};
export type QuizAttemptRow = {
  number: number;
  score: string;
  passed: boolean;
  correct: number;
  total: number;
  created_at: string;
};

/** Envia a apostila (PDF) de uma etapa de um curso em rascunho. */
export const uploadLessonFile = (
  courseId: string,
  lessonId: string,
  file: File
) =>
  api<Lesson>(`/courses/${courseId}/lessons/${lessonId}/file`, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/pdf',
      'X-File-Name': encodeURIComponent(file.name),
    },
  });
export type Assignment = {
  id: string;
  class_id: string;
  course_id: string;
  assigned_at: string;
  revoked_at: string | null;
};

export type ComplianceStatus =
  'pendente' | 'em_andamento' | 'revisar' | 'apto' | 'a_vencer' | 'vencido';

export type PathLesson = {
  id: string;
  position: number;
  title: string;
  type: LessonType;
  material_kind: Lesson['material_kind'];
  material_key: string | null;
  unity_key: string | null;
  passing_score: string | null;
  max_critical_errors: number | null;
  completed_at: string | null;
  vr_status: VrStatus | null;
  vr_outcome: 'passed' | 'needs_review' | null;
  best_score: string | null;
  attempts: number;
  vr_request_id: string | null;
  duration_minutes?: number | null;
  has_file?: boolean;
};

export type ComplianceRow = {
  enrollment_id: string;
  class_course_id: string;
  company_id: string;
  company_name: string;
  class_id: string;
  class_name: string;
  instructor_names: string[];
  student_id: string;
  student_name: string;
  student_email: string | null;
  course_id: string;
  course_title: string;
  validity_months: number | null;
  cycle: number;
  total_lessons: number;
  completed_lessons: number;
  completion_percent: number;
  completed_at: string | null;
  valid_until: string | null;
  status: ComplianceStatus;
};
export type LearningPath = ComplianceRow & {
  lessons: PathLesson[];
  course_description?: string | null;
  course_cover_url?: string | null;
  workload_hours?: string | null;
};
export type Certificate = ComplianceRow & {
  verification_code: string;
  company_cnpj: string | null;
  workload_hours: string | null;
  syllabus: string | null;
  technical_lead: string | null;
};
export type CertificateCheck = Pick<
  ComplianceRow,
  | 'student_name'
  | 'company_name'
  | 'course_title'
  | 'cycle'
  | 'completed_at'
  | 'valid_until'
> & { status: ComplianceStatus | 'renovado' };

export type VrStatus =
  'pending' | 'running' | 'completed' | 'cancelled' | 'expired';

/** Resultado enviado pelo Quest (schema v1 do relatório, ver unity-trainings TrainingReport.cs). */
export type ReportError = {
  type: string;
  detail?: string;
  critical?: boolean;
  elapsed_seconds?: number;
};
export type ReportStep = {
  step_id: string;
  competency_id?: string;
  duration_ms?: number;
  hints?: number;
  hesitations?: number;
  repetitions?: number;
  completed?: boolean;
  errors?: ReportError[];
};
export type TrainingResult = {
  schema_version?: string;
  completion?: 'completed' | 'abandoned' | string;
  score?: number;
  passed?: boolean;
  duration_seconds?: number;
  critical_errors?: number;
  hints_used?: number;
  mode?: string;
  steps?: ReportStep[];
  technical?: { avg_fps?: number; tracking_losses?: number; pauses?: number };
};
export type AttemptSummary = {
  number: number;
  completion?: string;
  score?: number | null;
  passed?: boolean | null;
  critical_errors?: number | null;
  ended_at?: string | null;
};
export type VrRequest = {
  id: string;
  company_id: string;
  mode: 'assessment' | 'practice';
  class_id: string | null;
  enrollment_id: string | null;
  course_id: string;
  class_course_id: string | null;
  lesson_id: string;
  requested_by: string;
  requested_by_name: string;
  course_title: string;
  student_name: string | null;
  lesson_title: string;
  quest_name: string | null;
  session_id: string;
  device_id: string | null;
  training_key: string;
  content_version: string;
  status: VrStatus;
  attempts: number;
  attempt_results: AttemptSummary[];
  last_score: string | null;
  best_score: string | null;
  critical_errors: number | null;
  outcome: 'passed' | 'needs_review' | null;
  last_result: TrainingResult | null;
  result_received_at: string | null;
  created_at: string;
  closed_at: string | null;
};

export type Quest = {
  id: string;
  device_id: string;
  name: string | null;
  registered_at: string | null;
  last_used_at: string | null;
  released_at: string | null;
  sessions: number;
  app_version: string | null;
  last_seen_at: string | null;
  busy: boolean | null;
};

const TOKEN_KEY = 'platform-safety.api-session';

function storedToken(): string | null {
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    return raw
      ? ((JSON.parse(raw) as { accessToken?: string }).accessToken ?? null)
      : null;
  } catch {
    return null;
  }
}

/** Avisado quando a API responde 401: a sessão acabou e o usuário precisa entrar de novo. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

function detailMessage(detail: unknown, status: number): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const first = detail[0] as { msg?: string } | undefined;
    if (first?.msg) return first.msg.replace(/^Value error, /, '');
  }
  if (status === 0)
    return 'Não foi possível falar com a plataforma. Verifique a conexão.';
  return 'Algo deu errado. Tente de novo em instantes.';
}

export async function api<T>(
  path: string,
  init: RequestInit & { token?: string | null; json?: unknown } = {}
): Promise<T> {
  const { token = storedToken(), json, headers, ...rest } = init;
  let response: Response;
  try {
    response = await fetch(API_URL + path, {
      ...rest,
      headers: {
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError(0, detailMessage(null, 0));
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.();
    throw new ApiError(
      response.status,
      detailMessage(body?.detail, response.status)
    );
  }
  return body as T;
}

export const post = <T>(path: string, json?: unknown) =>
  api<T>(path, { method: 'POST', json: json ?? {} });
export const patch = <T>(path: string, json: unknown) =>
  api<T>(path, { method: 'PATCH', json });
export const remove = (path: string) => api<void>(path, { method: 'DELETE' });

/** Envia a foto de capa do curso (Immersia): o corpo é a própria imagem. */
export const uploadCover = (courseId: string, file: File) =>
  api<Course>(`/courses/${courseId}/cover`, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
export const removeCover = (courseId: string) =>
  api<Course>(`/courses/${courseId}/cover`, { method: 'DELETE' });

export function errorText(
  error: unknown,
  fallback = 'Algo deu errado. Tente de novo.'
) {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** Entra com e-mail ou CPF. */
export async function login(loginValue: string, password: string) {
  const out = await api<{ access_token: string; user: User }>('/auth/login', {
    method: 'POST',
    token: null,
    json: { login: loginValue, password },
  });
  let companyName: string | null = null;
  if (out.user.company_id) {
    const companies = await api<Company[]>('/companies', {
      token: out.access_token,
    }).catch(() => []);
    companyName =
      companies.find((c) => c.id === out.user.company_id)?.name ?? null;
  }
  return { token: out.access_token, user: out.user, companyName };
}

// ---------------------------------------------------------------- learning analytics (/analytics, /me/analytics)
export type LearnerSignal = 'sem_tentativa' | 'reforco' | 'atencao' | 'bom';
export type CompetencyLevel = 'reforcar' | 'em_desenvolvimento' | 'dominada';

export type CompetencyStat = {
  competency_id: string;
  steps: number;
  error_rate: number;
  critical_errors: number;
  avg_duration_ms: number | null;
  hints_per_step: number;
  hesitations_per_step: number;
};

export type Analytics = {
  period: {
    start: string | null;
    end: string;
    days: number | null;
    bucket: 'day' | 'week' | 'month';
  };
  kpis: {
    learners: number;
    active_learners: number;
    participation: number | null;
    attempts: number;
    avg_score: number | null;
    pass_rate: number | null;
    improvement: number | null;
    avg_duration_seconds: number | null;
    training_minutes: number;
    need_support: number;
    no_attempt: number;
    apto: number;
    paths: number;
    expiring: number;
    completion_percent: number;
    critical_errors: number;
    hints: number;
    first_try_pass_rate: number | null;
    status_counts: Record<ComplianceStatus, number>;
  };
  by_attempt_number: AttemptCurvePoint[];
  steps: StepStat[];
  error_types: { type: string; count: number; critical: number }[];
  timeline: {
    date: string;
    attempts: number;
    avg_score: number | null;
    pass_rate: number | null;
  }[];
  score_bands: {
    key: 'otimo' | 'bom' | 'atencao' | 'critico';
    min: number;
    max: number;
    count: number;
    percent: number;
  }[];
  classes: ClassSummary[];
  lessons: {
    lesson_id: string;
    title: string;
    course_title: string;
    passing_score: number | null;
    attempts: number;
    learners: number;
    avg_score: number | null;
    pass_rate: number | null;
    first_try_pass_rate: number | null;
    avg_duration_seconds: number | null;
    critical_rate: number | null;
  }[];
  competencies: CompetencyStat[];
  hard_steps: {
    lesson_id: string;
    lesson_title: string;
    step_id: string;
    competency_id: string | null;
    occurrences: number;
    error_rate: number;
    critical_errors: number;
    avg_duration_ms: number | null;
    top_errors: { type: string; count: number }[];
  }[];
  learners: {
    student_id: string;
    name: string;
    enrollment_id: string | null;
    class_id: string | null;
    class_name: string;
    attempts: number;
    avg_score: number | null;
    best_score: number | null;
    last_score: number | null;
    trend: number | null;
    last_attempt_at: string | null;
    signal: LearnerSignal;
    completion_percent: number;
    apto: number;
    paths: number;
    enrolled_at: string | null;
    compliance: ComplianceStatus | null;
    errors: number;
    critical_errors: number;
    hints: number;
    minutes: number;
  }[];
  recent: {
    attempt_id: string;
    vr_request_id: string;
    number: number;
    student_id: string | null;
    student_name: string;
    class_name: string;
    lesson_title: string;
    course_title?: string;
    score: number;
    passed: boolean;
    critical_errors: number;
    duration_seconds: number | null;
    ended_at: string;
  }[];
};

/** Média semanal (últimas 8 semanas) para sparklines. */
export type WeeklyPoint = {
  date: string;
  avg_score: number | null;
  attempts: number;
};
export type AttemptCurvePoint = {
  number: number;
  label: string;
  attempts: number;
  avg_score: number | null;
  pass_rate: number | null;
};
export type ClassRisk = 'bom' | 'atencao' | 'critico' | 'sem_dados';

/** Resumo de uma turma (GET /analytics → classes). */
export type ClassSummary = {
  class_id: string;
  name: string;
  learners: number;
  instructor_names: string[];
  courses: string[];
  active_learners: number;
  participation: number | null;
  attempts: number;
  avg_score: number | null;
  pass_rate: number | null;
  improvement: number | null;
  need_support: number;
  no_attempt: number;
  apto: number;
  paths: number;
  completion_percent: number;
  status_counts: Record<ComplianceStatus, number>;
  last_attempt_at: string | null;
  risk: ClassRisk;
  weekly: WeeklyPoint[];
};

/** Uma etapa do treinamento, na ordem em que roda (GET /analytics → steps). */
export type StepStat = {
  lesson_id: string;
  lesson_title: string;
  step_id: string;
  competency_id: string | null;
  position: number;
  occurrences: number;
  error_rate: number;
  critical_errors: number;
  avg_duration_ms: number | null;
  hints_per_step: number;
  hesitations_per_step: number;
  top_errors: { type: string; count: number }[];
};

/** Um treinamento VR da galeria (GET /analytics/trainings). */
export type TrainingSummary = {
  lesson_id: string;
  title: string;
  unity_key: string;
  content_version: string;
  min_app_version: string | null;
  course_id: string;
  course_title: string;
  course_description: string | null;
  cover_url: string | null;
  passing_score: number;
  max_critical_errors: number;
  classes: number;
  learners_total: number;
  learners_passed: number;
  learners_tried: number;
  attempts: number;
  learners: number;
  avg_score: number | null;
  pass_rate: number | null;
  first_try_pass_rate: number | null;
  avg_duration_seconds: number | null;
  practice_runs: number;
  last_attempt_at: string | null;
  weakest_competency: string | null;
  weekly: WeeklyPoint[];
};

export type AttemptStep = {
  step_id: string;
  competency_id: string | null;
  completed: boolean;
  duration_ms: number | null;
  errors: number;
  critical_errors: number;
  error_types: string[];
  hints: number;
  hesitations: number;
};
export type AttemptRow = {
  attempt_id: string;
  vr_request_id: string;
  number: number;
  lesson_id: string;
  lesson_title: string;
  course_id: string;
  course_title?: string;
  class_id: string | null;
  passing_score: number | null;
  score: number;
  passed: boolean;
  completion: string | null;
  critical_errors: number;
  errors: number;
  hints_used: number;
  duration_seconds: number | null;
  ended_at: string;
  steps?: AttemptStep[];
};
export type NextStep = {
  kind:
    | 'reciclagem'
    | 'repetir_vr'
    | 'iniciar_vr'
    | 'estudar_material'
    | 'reforcar_competencia'
    | 'reciclagem_em_breve'
    | 'responder_quiz'
    | 'refazer_quiz';
  priority: number;
  enrollment_id: string | null;
  class_course_id: string | null;
  course_title: string | null;
  lesson_id: string | null;
  lesson_title: string | null;
  competency_id: string | null;
  best_score?: string | null;
  passing_score?: string | null;
  valid_until?: string | null;
};
export type LearnerAnalytics = {
  student: { id: string; name: string; email: string | null; active: boolean };
  classes: {
    enrollment_id: string;
    class_id: string;
    class_name: string;
    enrolled_at: string;
  }[];
  lessons: {
    lesson_id: string;
    title: string;
    attempts: number;
    passing_score: number | null;
    avg_score: number | null;
    best_score: number;
    last_score: number;
    passed: boolean;
    minutes: number;
    cohort_avg_score: number | null;
  }[];
  by_attempt_number: AttemptCurvePoint[];
  kpis: {
    attempts: number;
    avg_score: number | null;
    best_score: number | null;
    pass_rate: number | null;
    improvement: number | null;
    cohort_avg_score: number | null;
    training_minutes: number;
    apto: number;
    paths: number;
    completion_percent: number;
    errors: number;
    critical_errors: number;
    hints_used: number;
    avg_duration_seconds: number | null;
    last_attempt_at: string | null;
    courses_done: number;
    study_minutes: number;
    avg_days_to_complete: number | null;
    lessons_done: number;
    lessons_total: number;
    quiz_attempts: number;
    quiz_avg_score: number | null;
    quiz_first_try_pass_rate: number | null;
    quiz_avg_seconds: number | null;
    vr_first_try_pass_rate: number | null;
  };
  signal: LearnerSignal;
  paths: LearningPath[];
  timeline: AttemptRow[];
  recent_attempts: AttemptRow[];
  competencies: (CompetencyStat & {
    cohort_error_rate: number | null;
    cohort_avg_duration_ms: number | null;
    last_had_errors: boolean;
    level: CompetencyLevel;
  })[];
  next_steps: NextStep[];
  courses: CourseSummary[];
  quiz_timeline: {
    lesson_id: string;
    lesson_title: string;
    course_title: string;
    number: number;
    score: number;
    passed: boolean;
    duration_seconds: number | null;
    created_at: string;
  }[];
};

/** Um curso do aluno, no resumo de Meu desempenho. */
export type CourseSummary = {
  enrollment_id: string;
  class_course_id: string;
  course_id: string;
  course_title: string;
  class_name: string;
  cover_url: string | null;
  status: ComplianceStatus;
  completion_percent: number;
  lessons_done: number;
  lessons_total: number;
  vr_lessons: number;
  quiz_lessons: number;
  study_minutes: number;
  started_at: string | null;
  completed_at: string | null;
  days_to_complete: number | null;
  valid_until: string | null;
  vr_best_score: number | null;
  vr_attempts: number;
  quiz_avg_score: number | null;
  quiz_attempts: number;
};

/** GET /me/courses/{matricula}/{atribuicao}/analytics: o desempenho num curso. */
export type CourseAnalytics = {
  course: CourseSummary;
  path: LearningPath;
  kpis: {
    study_minutes: number;
    completion_percent: number;
    lessons_done: number;
    lessons_total: number;
    days_to_complete: number | null;
    started_at: string | null;
    vr_attempts: number;
    vr_avg_score: number | null;
    vr_best_score: number | null;
    quiz_attempts: number;
    quiz_avg_score: number | null;
    quiz_avg_seconds: number | null;
    cohort_vr_avg_score: number | null;
  };
  lessons: {
    lesson_id: string;
    position: number;
    title: string;
    type: LessonType;
    material_kind: MaterialKind | null;
    completed_at: string | null;
    duration_minutes: number | null;
    minutes: number;
    attempts: number;
    best_score: number | null;
    last_score: number | null;
    passing_score: number | null;
    passed: boolean | null;
  }[];
  vr: {
    lesson_id: string;
    title: string;
    passing_score: number | null;
    attempts: {
      number: number;
      score: number;
      passed: boolean;
      critical_errors: number;
      duration_seconds: number | null;
      ended_at: string;
      vr_request_id: string;
    }[];
    competencies: LearnerAnalytics['competencies'];
  }[];
  quizzes: {
    lesson_id: string;
    title: string;
    passing_score: number | null;
    attempts: {
      number: number;
      score: number;
      passed: boolean;
      correct: number;
      total: number;
      duration_seconds: number | null;
      created_at: string;
    }[];
    questions: {
      id: string;
      text: string;
      tries: number;
      right_rate: number | null;
      last_right: boolean | null;
    }[];
  }[];
  next_steps: NextStep[];
};

/** Um curso do catálogo Immersia visto pelo gestor (GET /catalog). */
export type CatalogCourse = {
  id: string;
  title: string;
  description: string | null;
  workload_hours: string | number | null;
  validity_months: number | null;
  syllabus: string | null;
  cover_url: string | null;
  released: boolean;
  lessons: number;
  materials: number;
  quizzes: number;
  vr_trainings: number;
  minutes: number | null;
};

/** Saúde de uma organização cliente no painel da Immersia. */
export type ClientHealth = 'ativa' | 'baixa' | 'parada' | 'sem_uso' | 'inativa';

/** Painel da Immersia: a plataforma inteira (GET /analytics/platform). */
export type PlatformAnalytics = {
  kpis: {
    companies: number;
    companies_total: number;
    learners: number;
    instructors: number;
    managers: number;
    new_learners: number;
    active_learners: number;
    active_learners_delta: number | null;
    attempts: number;
    attempts_delta: number | null;
    practice_runs: number;
    avg_score: number | null;
    avg_score_delta: number | null;
    pass_rate: number | null;
    vr_minutes: number;
    quizzes: number;
    quiz_pass_rate: number | null;
    courses_published: number;
    grants: number;
    quests: number;
    quests_used: number;
    paths: number;
    apto: number;
    compliance: number | null;
  };
  timeline: {
    date: string;
    attempts: number;
    avg_score: number | null;
    pass_rate: number | null;
    learners: number;
  }[];
  bucket: 'day' | 'week' | 'month';
  growth: {
    month: string;
    new_learners: number;
    new_companies: number;
    first_vr: number;
    attempts: number;
  }[];
  funnel: { key: string; label: string; value: number }[];
  vr_funnel: { tried: number; passed: number };
  companies: {
    company_id: string;
    name: string;
    active: boolean;
    learners: number;
    active_learners: number;
    participation: number | null;
    attempts: number;
    avg_score: number | null;
    pass_rate: number | null;
    courses: number;
    quests: number;
    compliance: number | null;
    apto: number;
    paths: number;
    last_activity_at: string | null;
    idle_days: number | null;
    health: ClientHealth;
  }[];
  courses: {
    course_id: string;
    title: string;
    cover_url: string | null;
    companies: number;
    learners: number;
    completion_percent: number | null;
    apto: number;
    compliance: number | null;
    attempts: number;
    avg_score: number | null;
    pass_rate: number | null;
    lessons_done: number;
  }[];
};
