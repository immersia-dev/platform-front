import type {
  AppRole,
  ContractStatus,
  LaunchType,
  LessonKind,
  MaterialKind,
  StudentGroupMembershipStatus,
  StudentGroupStatus,
  UserSex,
  UserStatus,
} from '../data/mockPlatform';

import { ApiError } from './apiError';
import * as demoApi from './demoApi';
import { isDemoMode } from './demoMode';

export { ApiError };

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

type ApiRequestOptions = RequestInit & {
  token?: string | null;
};



const detailMessages: Record<string, string> = {
  'Authenticated user no longer exists': 'Sua sessão não é mais válida. Entre novamente.',
  'Authentication credentials were not provided': 'Sua sessão expirou. Entre novamente.',
  'Cannot create users': 'Você não tem permissão para criar usuários.',
  'Cannot manage this role': 'Você não tem permissão para gerenciar este perfil.',
  'Cannot manage this user': 'Você não tem permissão para gerenciar este usuário.',
  'Create super admins with the dedicated seed command':
    'Super admins devem ser criados pelo seed dedicado.',
  'Current password is invalid': 'A senha atual está incorreta.',
  'Current password is required': 'Informe a senha atual para definir uma nova senha.',
  'Email verification code is required': 'Informe o código de verificação para alterar o e-mail.',
  'Email already exists': 'Já existe um usuário cadastrado com este e-mail.',
  'Forbidden group': 'Você não tem acesso a esta turma.',
  'Forbidden organization': 'Você não tem acesso a esta organização.',
  'Group code already exists for this organization':
    'Já existe uma turma com este código nesta organização.',
  'Group not found': 'Turma não encontrada.',
  'Instructor not found': 'Instrutor não encontrado.',
  'Instructor organization mismatch': 'O instrutor precisa pertencer à mesma organização da turma.',
  'Invalid email or password': 'O e-mail ou a senha estão incorretos.',
  'Invalid or expired access token': 'Sua sessão expirou. Entre novamente.',
  'Learner already has an active group': 'Este aluno já possui uma turma ativa.',
  'Learner not found': 'Aluno não encontrado.',
  'Learner organization mismatch': 'O aluno precisa pertencer à mesma organização da turma.',
  'Lesson not found': 'Aula não encontrada.',
  'Material not found': 'Material de estudo não encontrado.',
  'Membership not found': 'Vínculo do aluno não encontrado.',
  'Module access not found': 'Este módulo já não está liberado para a organização.',
  'Module is not enabled': 'O módulo desta trilha não está liberado para a organização.',
  'Module is not enabled for organization': 'O módulo desta trilha não está liberado para a organização.',
  'Module not found': 'Módulo não encontrado.',
  'Organization document already exists': 'Já existe uma organização com este CNPJ.',
  'Organization not found': 'Organização não encontrada.',
  'Organization or module not found': 'Organização ou módulo não encontrado.',
  'Cannot post attempts for another learner': 'Você não pode registrar tentativa para outro aluno.',
  'Group or training not found': 'Turma ou treinamento não encontrado.',
  'Track assignment not found': 'Encaminhamento da trilha não encontrado.',
  'Track is not assigned': 'Esta trilha não foi encaminhada para o seu perfil.',
  'Track not found': 'Trilha não encontrada.',
  'Training launch URL is not configured': 'O canal de execução deste treinamento não está configurado.',
  'Training not found': 'Treinamento não encontrado.',
  'User not found': 'Usuário não encontrado.',
  'You cannot manage your own account from this endpoint':
    'Use a tela de perfil para alterar seus próprios dados.',
};

function normalizeApiDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    const firstError = detail[0] as { msg?: string } | undefined;
    return firstError?.msg ?? 'Validation error';
  }

  return '';
}

function getStatusFallback(status: number): string {
  if (status === 0) return 'Não foi possível conectar ao backend.';
  if (status === 400) return 'A solicitação não pôde ser processada. Revise os dados informados.';
  if (status === 401) return 'Sua sessão expirou. Entre novamente.';
  if (status === 403) return 'Você não tem permissão para executar esta ação.';
  if (status === 404) return 'O registro solicitado não foi encontrado.';
  if (status === 405) return 'Esta ação não está disponível para a rota solicitada.';
  if (status === 409) return 'A ação conflita com um registro já existente.';
  if (status === 429) return 'Muitas tentativas em sequência. Aguarde um instante e tente novamente.';
  if (status === 422) return 'Revise os campos obrigatórios e tente novamente.';
  if (status >= 500) return 'O backend encontrou um erro inesperado.';
  return `Não foi possível concluir a ação. Código HTTP ${status}.`;
}

export function getApiErrorMessage(error: unknown, fallback = 'Não foi possível concluir a ação.') {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : fallback;
  }

  return detailMessages[error.message] ?? error.message ?? getStatusFallback(error.status);
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(0, getStatusFallback(0));
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as { detail?: unknown };
      const apiDetail = normalizeApiDetail(body.detail);
      detail = detailMessages[apiDetail] ?? apiDetail;
      if (!detail) {
        detail = getStatusFallback(response.status);
      }
    } catch {
      detail = getStatusFallback(response.status);
    }

    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type ApiSessionUser = {
  id: string;
  organization_id: string | null;
  organization_name: string | null;
  name: string;
  email: string;
  role: AppRole;
  status: UserStatus;
  last_access_at: string | null;
};

export type LoginResponse = {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: ApiSessionUser;
};

export function loginWithApi(email: string, password: string) {
  if (isDemoMode) return demoApi.demoLogin(email, password);

  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export type ProfileUpdatePayload = {
  name: string;
  email: string;
  documentNumber: string;
  sex: UserSex;
  birthDate: string;
  currentPassword?: string;
  newPassword?: string;
  emailVerificationCode?: string;
};

export function updateCurrentProfile(token: string, payload: ProfileUpdatePayload) {
  if (isDemoMode) return demoApi.demoUpdateCurrentProfile(token, payload);

  return apiRequest<ApiSessionUser>('/auth/me', {
    method: 'PATCH',
    token,
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      document_number: payload.documentNumber || null,
      sex: payload.sex,
      birth_date: payload.birthDate || null,
      current_password: payload.currentPassword || null,
      new_password: payload.newPassword || null,
      email_verification_code: payload.emailVerificationCode || null,
    }),
  });
}

export function fetchPlatformSnapshot<T>(token: string) {
  if (isDemoMode) return demoApi.demoSnapshot<T>();

  return apiRequest<T>('/platform/snapshot', { token });
}

export function updateLessonProgress<T>(token: string, lessonId: string, status: string) {
  if (isDemoMode) return demoApi.demoUpdateLessonProgress<T>(token, lessonId, status);

  return apiRequest<T>(`/studies/lessons/${lessonId}/progress`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ status }),
  });
}

export type TrainingLaunchResponse = {
  immersive_training_id: string;
  launch_type: 'web_url' | 'meta_app';
  launch_url: string | null;
  enabled: boolean;
  unavailable_reason: string | null;
  result_callback_url: string;
  result_contract_version: string;
};

export function fetchTrainingLaunch(token: string, trainingId: string) {
  if (isDemoMode) return demoApi.demoTrainingLaunch(token, trainingId);

  return apiRequest<TrainingLaunchResponse>(`/studies/immersive-trainings/${trainingId}/launch`, {
    token,
  });
}

export type UserMutationPayload = {
  name: string;
  email: string;
  password?: string;
  role: AppRole;
  organizationId: string | null;
  documentNumber: string;
  sex: UserSex;
  birthDate: string;
  status: UserStatus;
};

function toApiUserPayload(payload: UserMutationPayload) {
  return {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    organization_id: payload.organizationId,
    document_number: payload.documentNumber || null,
    sex: payload.sex,
    birth_date: payload.birthDate || null,
    status: payload.status,
  };
}

export function createUser<T>(token: string, payload: UserMutationPayload) {
  if (isDemoMode) return demoApi.demoCreateUser<T>(token, payload);

  return apiRequest<T>('/users', {
    method: 'POST',
    token,
    body: JSON.stringify(toApiUserPayload(payload)),
  });
}

export function updateUser<T>(token: string, userId: string, payload: UserMutationPayload) {
  if (isDemoMode) return demoApi.demoUpdateUser<T>(token, userId, payload);

  return apiRequest<T>(`/users/${userId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(toApiUserPayload(payload)),
  });
}

export function deactivateUser<T>(token: string, userId: string) {
  if (isDemoMode) return demoApi.demoDeactivateUser<T>(token, userId);

  return apiRequest<T>(`/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}

export type OrganizationMutationPayload = {
  name: string;
  documentNumber: string;
  status: ContractStatus;
};

function toApiOrganizationPayload(payload: OrganizationMutationPayload) {
  return {
    name: payload.name,
    document_number: payload.documentNumber || null,
    owner_name: null,
    status: payload.status,
  };
}

export function createOrganization<T>(token: string, payload: OrganizationMutationPayload) {
  if (isDemoMode) return demoApi.demoCreateOrganization<T>(token, payload);

  return apiRequest<T>('/organizations', {
    method: 'POST',
    token,
    body: JSON.stringify(toApiOrganizationPayload(payload)),
  });
}

export function updateOrganization<T>(
  token: string,
  organizationId: string,
  payload: OrganizationMutationPayload
) {
  if (isDemoMode) return demoApi.demoUpdateOrganization<T>(token, organizationId, payload);

  return apiRequest<T>(`/organizations/${organizationId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(toApiOrganizationPayload(payload)),
  });
}

export function deactivateOrganization<T>(token: string, organizationId: string) {
  if (isDemoMode) return demoApi.demoDeactivateOrganization<T>(token, organizationId);

  return apiRequest<T>(`/organizations/${organizationId}`, {
    method: 'DELETE',
    token,
  });
}

export function grantOrganizationModuleAccess<T>(
  token: string,
  organizationId: string,
  moduleId: string
) {
  if (isDemoMode) return demoApi.demoGrantOrganizationModuleAccess<T>(token, organizationId, moduleId);

  return apiRequest<T>(`/organizations/${organizationId}/module-access/${moduleId}`, {
    method: 'POST',
    token,
  });
}

export function revokeOrganizationModuleAccess(token: string, organizationId: string, moduleId: string) {
  if (isDemoMode) return demoApi.demoRevokeOrganizationModuleAccess(token, organizationId, moduleId);

  return apiRequest<void>(`/organizations/${organizationId}/module-access/${moduleId}`, {
    method: 'DELETE',
    token,
  });
}

export type GroupMutationPayload = {
  organizationId: string;
  instructorId: string | null;
  name: string;
  code: string;
  description: string;
  status: StudentGroupStatus;
};

function toApiGroupPayload(payload: GroupMutationPayload) {
  return {
    organization_id: payload.organizationId,
    instructor_id: payload.instructorId,
    name: payload.name,
    code: payload.code,
    description: payload.description,
    status: payload.status,
  };
}

export function createGroup<T>(token: string, payload: GroupMutationPayload) {
  if (isDemoMode) return demoApi.demoCreateGroup<T>(token, payload);

  return apiRequest<T>('/groups', {
    method: 'POST',
    token,
    body: JSON.stringify(toApiGroupPayload(payload)),
  });
}

export function archiveGroup<T>(token: string, groupId: string) {
  if (isDemoMode) return demoApi.demoArchiveGroup<T>(token, groupId);

  return apiRequest<T>(`/groups/${groupId}`, {
    method: 'DELETE',
    token,
  });
}

export function addGroupMembership<T>(
  token: string,
  groupId: string,
  learnerId: string,
  status: StudentGroupMembershipStatus = 'active'
) {
  if (isDemoMode) return demoApi.demoAddGroupMembership<T>(token, groupId, learnerId, status);

  return apiRequest<T>(`/groups/${groupId}/memberships`, {
    method: 'POST',
    token,
    body: JSON.stringify({ learner_id: learnerId, status }),
  });
}

export function removeGroupMembership<T>(token: string, groupId: string, learnerId: string) {
  if (isDemoMode) return demoApi.demoRemoveGroupMembership<T>(token, groupId, learnerId);

  return apiRequest<T>(`/groups/${groupId}/memberships/${learnerId}`, {
    method: 'DELETE',
    token,
  });
}

export function assignTrackToGroup<T>(token: string, groupId: string, trackId: string) {
  if (isDemoMode) return demoApi.demoAssignTrackToGroup<T>(token, groupId, trackId);

  return apiRequest<T>(`/groups/${groupId}/track-assignments`, {
    method: 'POST',
    token,
    body: JSON.stringify({ track_id: trackId }),
  });
}

export function removeTrackAssignment(token: string, groupId: string, trackId: string) {
  if (isDemoMode) return demoApi.demoRemoveTrackAssignment(token, groupId, trackId);

  return apiRequest<void>(`/groups/${groupId}/track-assignments/${trackId}`, {
    method: 'DELETE',
    token,
  });
}

export type StudyModuleMutationPayload = {
  name: string;
  slug: string;
  summary: string;
  isActive: boolean;
};

export function createStudyModule<T>(token: string, payload: StudyModuleMutationPayload) {
  if (isDemoMode) return demoApi.demoCreateStudyModule<T>(token, payload);

  return apiRequest<T>('/studies/modules', {
    method: 'POST',
    token,
    body: JSON.stringify({
      name: payload.name,
      slug: payload.slug,
      summary: payload.summary,
      is_active: payload.isActive,
    }),
  });
}

export type StudyTrackMutationPayload = {
  moduleId: string;
  title: string;
  slug: string;
  summary: string;
  level: 'introductory' | 'operational' | 'advanced';
  imageUrl: string;
};

export function createStudyTrack<T>(token: string, payload: StudyTrackMutationPayload) {
  if (isDemoMode) return demoApi.demoCreateStudyTrack<T>(token, payload);

  return apiRequest<T>('/studies/tracks', {
    method: 'POST',
    token,
    body: JSON.stringify({
      module_id: payload.moduleId,
      title: payload.title,
      slug: payload.slug,
      summary: payload.summary,
      level: payload.level,
      image_url: payload.imageUrl || null,
    }),
  });
}

export type StudyMaterialMutationPayload = {
  kind: MaterialKind;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
};

export function createStudyMaterial<T>(token: string, payload: StudyMaterialMutationPayload) {
  if (isDemoMode) return demoApi.demoCreateStudyMaterial<T>(token, payload);

  return apiRequest<T>('/studies/materials', {
    method: 'POST',
    token,
    body: JSON.stringify({
      kind: payload.kind,
      title: payload.title,
      description: payload.description,
      url: payload.url,
      thumbnail_url: payload.thumbnailUrl || null,
    }),
  });
}

export type ImmersiveTrainingMutationPayload = {
  moduleId: string;
  title: string;
  description: string;
  minutes: number;
  launchType: LaunchType;
  launchUrl: string;
  enabled: boolean;
  imageUrl: string;
  legacyTrainingId: string;
};

export function createImmersiveTraining<T>(
  token: string,
  payload: ImmersiveTrainingMutationPayload
) {
  if (isDemoMode) return demoApi.demoCreateImmersiveTraining<T>(token, payload);

  return apiRequest<T>('/studies/immersive-trainings', {
    method: 'POST',
    token,
    body: JSON.stringify({
      module_id: payload.moduleId,
      title: payload.title,
      description: payload.description,
      minutes: payload.minutes,
      launch_type: payload.launchType,
      launch_url: payload.launchUrl || null,
      enabled: payload.enabled,
      image_url: payload.imageUrl || null,
      legacy_training_id: payload.legacyTrainingId || null,
    }),
  });
}

export type StudyLessonMutationPayload = {
  trackId: string;
  order: number;
  title: string;
  description: string;
  kind: LessonKind;
  required: boolean;
  durationMinutes: number;
  materialId: string;
  immersiveTrainingId: string;
};

export function createStudyLesson<T>(token: string, payload: StudyLessonMutationPayload) {
  if (isDemoMode) return demoApi.demoCreateStudyLesson<T>(token, payload);

  return apiRequest<T>('/studies/lessons', {
    method: 'POST',
    token,
    body: JSON.stringify({
      track_id: payload.trackId,
      order_index: payload.order,
      title: payload.title,
      description: payload.description,
      kind: payload.kind,
      required: payload.required,
      duration_minutes: payload.durationMinutes,
      material_id: payload.kind === 'study_material' ? payload.materialId : null,
      immersive_training_id:
        payload.kind === 'immersive_training' ? payload.immersiveTrainingId : null,
    }),
  });
}

export type StudyPackageMutationPayload = {
  moduleMode: 'existing' | 'new';
  moduleId: string;
  module: StudyModuleMutationPayload;
  track: StudyTrackMutationPayload;
  includeMaterial: boolean;
  material: StudyMaterialMutationPayload & {
    lessonTitle: string;
    lessonDescription: string;
    durationMinutes: number;
    required: boolean;
  };
  training: ImmersiveTrainingMutationPayload & {
    lessonTitle: string;
    lessonDescription: string;
    durationMinutes: number;
    required: boolean;
  };
};

export function createStudyPackage<T>(token: string, payload: StudyPackageMutationPayload) {
  if (isDemoMode) return demoApi.demoCreateStudyPackage<T>(token, payload);

  return apiRequest<T>('/studies/packages', {
    method: 'POST',
    token,
    body: JSON.stringify({
      module_id: payload.moduleMode === 'existing' ? payload.moduleId : null,
      module:
        payload.moduleMode === 'new'
          ? {
              name: payload.module.name,
              slug: payload.module.slug,
              summary: payload.module.summary,
              is_active: payload.module.isActive,
            }
          : null,
      track: {
        title: payload.track.title,
        slug: payload.track.slug,
        summary: payload.track.summary,
        level: payload.track.level,
        image_url: payload.track.imageUrl || null,
      },
      material_step: payload.includeMaterial
        ? {
            kind: payload.material.kind,
            title: payload.material.title,
            description: payload.material.description,
            url: payload.material.url,
            thumbnail_url: payload.material.thumbnailUrl || null,
            lesson_title: payload.material.lessonTitle,
            lesson_description: payload.material.lessonDescription,
            duration_minutes: payload.material.durationMinutes,
            required: payload.material.required,
          }
        : null,
      training_step: {
        title: payload.training.title,
        description: payload.training.description,
        minutes: payload.training.minutes,
        launch_type: payload.training.launchType,
        launch_url: payload.training.launchUrl || null,
        enabled: payload.training.enabled,
        image_url: payload.training.imageUrl || null,
        legacy_training_id: payload.training.legacyTrainingId || null,
        lesson_title: payload.training.lessonTitle,
        lesson_description: payload.training.lessonDescription,
        duration_minutes: payload.training.durationMinutes,
        required: payload.training.required,
      },
    }),
  });
}
