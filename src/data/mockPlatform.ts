import fireExtinguisher from '../assets/fire_extinguisher.jpg';
import nr10Best from '../assets/nr10_best.jpg';
import nr10Intro from '../assets/nr10_intro.jpg';
import nr10Risks from '../assets/nr10_risks.jpg';

export type AppRole = 'super_admin' | 'org_admin' | 'instructor' | 'learner';
export type UserStatus = 'active' | 'invited' | 'inactive';
export type UserSex = 'female' | 'male' | 'other' | 'not_informed';
export type ContractStatus = 'active' | 'onboarding' | 'inactive';
export type TrainingModality = 'VR';
export type AttemptOutcome = 'approved' | 'needs_attention';
export type StudentGroupStatus = 'active' | 'archived';
export type StudentGroupMembershipStatus = 'active' | 'completed' | 'transferred';

export type OrganizationRecord = {
  id: string;
  name: string;
  documentNumber: string;
  ownerName: string;
  totalUsers: number;
  activeModules: number;
  status: ContractStatus;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  documentNumber: string;
  sex: UserSex;
  birthDate: string;
  role: AppRole;
  organizationId: string | null;
  organizationName: string | null;
  status: UserStatus;
  lastAccessAt?: string | null;
};

export type StudentGroupRecord = {
  id: string;
  organizationId: string;
  instructorId: string | null;
  name: string;
  code: string;
  description: string;
  status: StudentGroupStatus;
};

export type StudentGroupMembershipRecord = {
  id: string;
  groupId: string;
  learnerId: string;
  status: StudentGroupMembershipStatus;
  startedAt: string;
  endedAt: string | null;
};

export type StudentGroupModuleAccessRecord = {
  id: string;
  groupId: string;
  moduleId: string;
  assignedAt: string;
};

export type LessonKind = 'study_material' | 'immersive_training';
export type MaterialKind = 'pdf' | 'video' | 'image' | 'link';
export type LaunchType = 'web_url' | 'meta_app';
export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

export type StudyMaterialRecord = {
  id: string;
  kind: MaterialKind;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
};

export type ImmersiveTrainingRecord = {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  minutes: number;
  launchType: LaunchType;
  launchUrl: string;
  enabled: boolean;
  imageUrl?: string;
  legacyTrainingId?: string;
};

export type StudyLessonRecord = {
  id: string;
  trackId: string;
  order: number;
  title: string;
  description: string;
  kind: LessonKind;
  required: boolean;
  durationMinutes: number;
  materialId?: string;
  immersiveTrainingId?: string;
};

export type StudyTrackRecord = {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  summary: string;
  level: 'introductory' | 'operational' | 'advanced';
  imageUrl?: string;
};

export type TrackAssignmentRecord = {
  id: string;
  groupId: string;
  trackId: string;
  assignedByUserId: string;
  assignedAt: string;
};

export type LessonProgressRecord = {
  id: string;
  learnerId: string;
  lessonId: string;
  status: LessonProgressStatus;
  startedAt: string | null;
  completedAt: string | null;
};

export type TrainingRecord = {
  id: string;
  title: string;
  description: string;
  minutes: number;
  completed: boolean;
  imageUrl?: string;
  modality: TrainingModality;
  url: string;
  enabled?: boolean;
};

export type ModuleRecord = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  organizationIds: string[];
  trainings: TrainingRecord[];
};

export type TrainingAttemptRecord = {
  id: string;
  learnerId: string;
  organizationId: string;
  groupId: string;
  moduleId: string;
  trainingId: string;
  attemptNumber: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  responseTimeMinutes: number;
  criticalErrors: number;
  hintsUsed: number;
  completedAt: string;
  outcome: AttemptOutcome;
  report: string;
};

export const roleLabels: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Admin da organização',
  instructor: 'Instrutor',
  learner: 'Aluno',
};

export const organizationsSeed: OrganizationRecord[] = [
  {
    id: 'org-1',
    name: 'Organização Demo',
    documentNumber: '12.345.678/0001-90',
    ownerName: 'Mariana Costa',
    totalUsers: 17,
    activeModules: 1,
    status: 'active',
  },
  {
    id: 'org-2',
    name: 'Usina Atlas',
    documentNumber: '23.456.789/0001-01',
    ownerName: 'Bruno Carvalho',
    totalUsers: 28,
    activeModules: 1,
    status: 'active',
  },
  {
    id: 'org-3',
    name: 'Logisafe Transportes',
    documentNumber: '34.567.890/0001-12',
    ownerName: 'Patrícia Gomes',
    totalUsers: 6,
    activeModules: 1,
    status: 'onboarding',
  },
];

export const usersSeed: UserRecord[] = [
  {
    id: 'user-super',
    name: 'Admin Immersia',
    email: 'admin@immersia.dev',
    documentNumber: '000.000.000-00',
    sex: 'not_informed',
    birthDate: '1990-01-15',
    role: 'super_admin',
    organizationId: null,
    organizationName: null,
    status: 'active',
    lastAccessAt: '2026-04-19T18:40:00Z',
  },
  {
    id: 'user-org-admin-1',
    name: 'Mariana Costa',
    email: 'mariana.costa@empresa-demo.com',
    documentNumber: '111.222.333-44',
    sex: 'female',
    birthDate: '1988-05-21',
    role: 'org_admin',
    organizationId: 'org-1',
    organizationName: 'Organização Demo',
    status: 'active',
    lastAccessAt: '2026-04-18T13:20:00Z',
  },
  {
    id: 'user-org-admin-3',
    name: 'Ricardo Almeida',
    email: 'ricardo.almeida@empresa-demo.com',
    documentNumber: '222.333.444-55',
    sex: 'male',
    birthDate: '1985-09-12',
    role: 'org_admin',
    organizationId: 'org-1',
    organizationName: 'Organização Demo',
    status: 'active',
    lastAccessAt: '2026-04-17T16:10:00Z',
  },
  {
    id: 'user-instructor-1',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@empresa-demo.com',
    documentNumber: '333.444.555-66',
    sex: 'male',
    birthDate: '1991-03-08',
    role: 'instructor',
    organizationId: 'org-1',
    organizationName: 'Organização Demo',
    status: 'active',
    lastAccessAt: '2026-04-20T12:45:00Z',
  },
  {
    id: 'user-instructor-2',
    name: 'Juliana Ferreira',
    email: 'juliana.ferreira@empresa-demo.com',
    documentNumber: '444.555.666-77',
    sex: 'female',
    birthDate: '1992-07-17',
    role: 'instructor',
    organizationId: 'org-1',
    organizationName: 'Organização Demo',
    status: 'active',
    lastAccessAt: '2026-04-19T15:30:00Z',
  },
  {
    id: 'user-learner-1',
    name: 'Paula Ribeiro',
    email: 'paula.ribeiro@empresa-demo.com',
    documentNumber: '555.666.777-88',
    sex: 'female',
    birthDate: '1997-11-03',
    role: 'learner',
    organizationId: 'org-1',
    organizationName: 'Organização Demo',
    status: 'active',
    lastAccessAt: '2026-04-09T12:35:00Z',
  },
  {
    id: 'user-learner-3',
    name: 'Diego Martins',
    email: 'diego.martins@empresa-demo.com',
    documentNumber: '666.777.888-99',
    sex: 'male',
    birthDate: '1995-02-26',
    role: 'learner',
    organizationId: 'org-1',
    organizationName: 'Organização Demo',
    status: 'active',
    lastAccessAt: '2026-04-09T15:55:00Z',
  },
  {
    id: 'user-learner-4',
    name: 'Fernanda Souza',
    email: 'fernanda.souza@empresa-demo.com',
    documentNumber: '777.888.999-00',
    sex: 'female',
    birthDate: '1998-08-14',
    role: 'learner',
    organizationId: 'org-1',
    organizationName: 'Organização Demo',
    status: 'active',
    lastAccessAt: '2026-04-09T17:18:00Z',
  },
  {
    id: 'user-learner-5',
    name: 'Rafael Lima',
    email: 'rafael.lima@empresa-demo.com',
    documentNumber: '888.999.000-11',
    sex: 'male',
    birthDate: '1994-04-30',
    role: 'learner',
    organizationId: 'org-1',
    organizationName: 'Organização Demo',
    status: 'inactive',
    lastAccessAt: '2026-04-08T15:15:00Z',
  },
  {
    id: 'user-learner-6',
    name: 'Camila Rocha',
    email: 'camila.rocha@empresa-demo.com',
    documentNumber: '999.000.111-22',
    sex: 'female',
    birthDate: '1999-12-06',
    role: 'learner',
    organizationId: 'org-1',
    organizationName: 'Organização Demo',
    status: 'invited',
    lastAccessAt: null,
  },
  {
    id: 'user-org-admin-2',
    name: 'Bruno Carvalho',
    email: 'bruno.carvalho@usina-atlas.com',
    documentNumber: '123.456.789-10',
    sex: 'male',
    birthDate: '1987-10-19',
    role: 'org_admin',
    organizationId: 'org-2',
    organizationName: 'Usina Atlas',
    status: 'active',
    lastAccessAt: '2026-04-15T13:10:00Z',
  },
  {
    id: 'user-learner-2',
    name: 'Kelly Santos',
    email: 'kelly.santos@usina-atlas.com',
    documentNumber: '234.567.891-01',
    sex: 'female',
    birthDate: '1996-06-25',
    role: 'learner',
    organizationId: 'org-2',
    organizationName: 'Usina Atlas',
    status: 'active',
    lastAccessAt: '2026-04-02T13:25:00Z',
  },
];

export const studentGroupsSeed: StudentGroupRecord[] = [
  {
    id: 'group-brigade-a',
    organizationId: 'org-1',
    instructorId: 'user-instructor-1',
    name: 'Brigada A',
    code: 'BRG-A',
    description: 'Turma ativa para treinamentos de resposta a emergência e combate a incêndio.',
    status: 'active',
  },
  {
    id: 'group-electrical-maintenance',
    organizationId: 'org-1',
    instructorId: 'user-instructor-2',
    name: 'Manutenção elétrica',
    code: 'MNT-EL',
    description:
      'Equipe de manutenção elétrica em formação de brigada (NR-23). A trilha de NR-10 será encaminhada quando o treinamento for lançado.',
    status: 'active',
  },
  {
    id: 'group-nr23-refresh',
    organizationId: 'org-1',
    instructorId: 'user-instructor-1',
    name: 'Reciclagem NR-23',
    code: 'REC-23',
    description: 'Turma anterior usada para reciclagem de prevenção e combate a incêndio.',
    status: 'archived',
  },
  {
    id: 'group-usina-atlas-a',
    organizationId: 'org-2',
    instructorId: null,
    name: 'Operação Atlas A',
    code: 'ATL-A',
    description: 'Turma operacional da Usina Atlas para treinamentos liberados.',
    status: 'active',
  },
];

export const studentGroupMembershipsSeed: StudentGroupMembershipRecord[] = [
  {
    id: 'membership-paula-active',
    groupId: 'group-brigade-a',
    learnerId: 'user-learner-1',
    status: 'active',
    startedAt: '2026-03-18T12:00:00Z',
    endedAt: null,
  },
  {
    id: 'membership-paula-completed',
    groupId: 'group-nr23-refresh',
    learnerId: 'user-learner-1',
    status: 'completed',
    startedAt: '2026-01-10T12:00:00Z',
    endedAt: '2026-02-12T18:00:00Z',
  },
  {
    id: 'membership-diego-active',
    groupId: 'group-brigade-a',
    learnerId: 'user-learner-3',
    status: 'active',
    startedAt: '2026-03-18T12:00:00Z',
    endedAt: null,
  },
  {
    id: 'membership-fernanda-active',
    groupId: 'group-electrical-maintenance',
    learnerId: 'user-learner-4',
    status: 'active',
    startedAt: '2026-03-25T12:00:00Z',
    endedAt: null,
  },
  {
    id: 'membership-rafael-active',
    groupId: 'group-brigade-a',
    learnerId: 'user-learner-5',
    status: 'active',
    startedAt: '2026-04-01T12:00:00Z',
    endedAt: null,
  },
  {
    id: 'membership-camila-active',
    groupId: 'group-electrical-maintenance',
    learnerId: 'user-learner-6',
    status: 'active',
    startedAt: '2026-04-02T12:00:00Z',
    endedAt: null,
  },
  {
    id: 'membership-kelly-active',
    groupId: 'group-usina-atlas-a',
    learnerId: 'user-learner-2',
    status: 'active',
    startedAt: '2026-03-20T12:00:00Z',
    endedAt: null,
  },
];

export const studentGroupModuleAccessSeed: StudentGroupModuleAccessRecord[] = [
  {
    id: 'group-module-brigade-a-nr23',
    groupId: 'group-brigade-a',
    moduleId: 'module-nr-23',
    assignedAt: '2026-03-18T12:00:00Z',
  },
  {
    id: 'group-module-electrical-nr23',
    groupId: 'group-electrical-maintenance',
    moduleId: 'module-nr-23',
    assignedAt: '2026-03-25T12:00:00Z',
  },
  {
    id: 'group-module-refresh-nr23',
    groupId: 'group-nr23-refresh',
    moduleId: 'module-nr-23',
    assignedAt: '2026-01-10T12:00:00Z',
  },
  {
    id: 'group-module-atlas-nr23',
    groupId: 'group-usina-atlas-a',
    moduleId: 'module-nr-23',
    assignedAt: '2026-03-20T12:00:00Z',
  },
];

/**
 * Catálogo da vitrine: NR-23 é o módulo ativo (treinamento real de incêndio
 * classe A no Meta Quest); NR-10 e NR-33 aparecem como "Em breve" — sem
 * treinamentos habilitados e ainda não liberados para nenhuma organização.
 */
export const modulesSeed: ModuleRecord[] = [
  {
    id: 'module-nr-23',
    name: 'NR-23',
    slug: 'nr-23',
    summary:
      'Prevenção e combate a incêndio: resposta inicial a incêndio classe A e uso correto do extintor (NR-23 / NBR 12693).',
    organizationIds: ['org-1', 'org-2', 'org-3'],
    trainings: [
      {
        id: 'nr23-1',
        title: 'Incêndio classe A: escolha e uso do extintor',
        description:
          'Identifique a classe do fogo, selecione o extintor adequado e combata o princípio de incêndio com segurança.',
        minutes: 30,
        completed: true,
        modality: 'VR',
        url: 'https://immersia-plataform-firefighting-01.netlify.app/',
        enabled: true,
        imageUrl: fireExtinguisher,
      },
      {
        id: 'nr23-2',
        title: 'Inspeção inicial da área',
        description:
          'Reconheça riscos, rotas de fuga e condições do ambiente antes do início da resposta.',
        minutes: 20,
        completed: false,
        modality: 'VR',
        url: 'https://example.com/nr23-2',
        enabled: true,
        imageUrl: fireExtinguisher,
      },
    ],
  },
  {
    id: 'module-nr-10',
    name: 'NR-10',
    slug: 'nr-10',
    summary:
      'Segurança em instalações e serviços com eletricidade. Treinamento em desenvolvimento.',
    organizationIds: [],
    trainings: [
      {
        id: 'nr10-1',
        title: 'Introdução à NR-10',
        description:
          'Revise conceitos, responsabilidades e critérios mínimos exigidos na operação.',
        minutes: 25,
        completed: false,
        modality: 'VR',
        url: '',
        enabled: false,
        imageUrl: nr10Intro,
      },
      {
        id: 'nr10-2',
        title: 'Riscos elétricos',
        description:
          'Mapeie perigos, sinais de alerta e formas de prevenção em cenários críticos.',
        minutes: 40,
        completed: false,
        modality: 'VR',
        url: '',
        enabled: false,
        imageUrl: nr10Risks,
      },
    ],
  },
  {
    id: 'module-nr-33',
    name: 'NR-33',
    slug: 'nr-33',
    summary:
      'Segurança e saúde nos trabalhos em espaços confinados. Treinamento em desenvolvimento.',
    organizationIds: [],
    trainings: [
      {
        id: 'nr33-1',
        title: 'Entrada segura em espaço confinado',
        description:
          'Pratique a liberação de entrada, a monitoração da atmosfera e o papel do vigia.',
        minutes: 30,
        completed: false,
        modality: 'VR',
        url: '',
        enabled: false,
        imageUrl: nr10Best,
      },
    ],
  },
];

export const studyMaterialsSeed: StudyMaterialRecord[] = [
  {
    id: 'material-nr23-fire-classes-pdf',
    kind: 'pdf',
    title: 'Guia rápido de classes de incêndio',
    description:
      'Material de apoio para reconhecer classes de fogo e critérios de escolha do extintor.',
    url: 'https://example.com/materials/nr23-classes-incendio.pdf',
    thumbnailUrl: fireExtinguisher,
  },
  {
    id: 'material-nr23-evacuation-image',
    kind: 'image',
    title: 'Mapa visual de abandono de área',
    description:
      'Imagem de referência com pontos de encontro, rotas de fuga e sinalização essencial.',
    url: fireExtinguisher,
    thumbnailUrl: fireExtinguisher,
  },
  {
    id: 'material-nr10-intro-video',
    kind: 'video',
    title: 'Fundamentos da NR-10',
    description:
      'Vídeo curto para alinhar responsabilidades, autorização e riscos elétricos recorrentes.',
    url: 'https://example.com/videos/nr10-fundamentos',
    thumbnailUrl: nr10Intro,
  },
  {
    id: 'material-nr10-checklist-link',
    kind: 'link',
    title: 'Checklist de bloqueio e etiquetagem',
    description:
      'Referência externa para revisar uma sequência segura antes da atividade elétrica.',
    url: 'https://example.com/checklists/bloqueio-etiquetagem',
    thumbnailUrl: nr10Best,
  },
  {
    id: 'material-nr33-entry-pdf',
    kind: 'pdf',
    title: 'Permissão de entrada e trabalho (PET)',
    description:
      'Resumo da permissão de entrada, monitoração da atmosfera e responsabilidades do vigia.',
    url: 'https://example.com/materials/nr33-permissao-entrada.pdf',
    thumbnailUrl: nr10Best,
  },
];

export const immersiveTrainingsSeed: ImmersiveTrainingRecord[] = [
  {
    id: 'immersive-nr23-extinguisher',
    moduleId: 'module-nr-23',
    title: 'Incêndio classe A: escolha e uso do extintor',
    description:
      'Simulação imersiva para identificar a classe do fogo, escolher o extintor e combater o princípio de incêndio.',
    minutes: 30,
    launchType: 'web_url',
    launchUrl: 'https://immersia-plataform-firefighting-01.netlify.app/',
    enabled: true,
    imageUrl: fireExtinguisher,
    legacyTrainingId: 'nr23-1',
  },
  {
    id: 'immersive-nr23-inspection',
    moduleId: 'module-nr-23',
    title: 'Inspeção inicial da área',
    description:
      'Experiência imersiva para reconhecer riscos, rotas de fuga e condições do ambiente.',
    minutes: 20,
    launchType: 'web_url',
    launchUrl: 'https://example.com/nr23-2',
    enabled: true,
    imageUrl: fireExtinguisher,
    legacyTrainingId: 'nr23-2',
  },
  {
    id: 'immersive-nr10-intro',
    moduleId: 'module-nr-10',
    title: 'Introdução à NR-10',
    description:
      'Atividade guiada para revisar conceitos, responsabilidades e critérios mínimos.',
    minutes: 25,
    launchType: 'meta_app',
    launchUrl: '',
    enabled: false,
    imageUrl: nr10Intro,
    legacyTrainingId: 'nr10-1',
  },
  {
    id: 'immersive-nr10-risks-meta',
    moduleId: 'module-nr-10',
    title: 'Riscos elétricos no headset',
    description:
      'Prática no Meta Quest para leitura de riscos elétricos em cenários críticos.',
    minutes: 40,
    launchType: 'meta_app',
    launchUrl: '',
    enabled: false,
    imageUrl: nr10Risks,
    legacyTrainingId: 'nr10-2',
  },
  {
    id: 'immersive-nr33-entry-meta',
    moduleId: 'module-nr-33',
    title: 'Entrada segura em espaço confinado',
    description:
      'Prática no Meta Quest para liberação de entrada, monitoração da atmosfera e papel do vigia.',
    minutes: 30,
    launchType: 'meta_app',
    launchUrl: '',
    enabled: false,
    imageUrl: nr10Best,
    legacyTrainingId: 'nr33-1',
  },
];

export const studyTracksSeed: StudyTrackRecord[] = [
  {
    id: 'track-nr23-first-response',
    moduleId: 'module-nr-23',
    title: 'Resposta inicial a princípio de incêndio',
    slug: 'nr23-resposta-inicial',
    summary:
      'Trilha para preparar alunos antes da prática de escolha do extintor e da inspeção da área.',
    level: 'introductory',
    imageUrl: fireExtinguisher,
  },
  {
    id: 'track-nr23-evacuation',
    moduleId: 'module-nr-23',
    title: 'Abandono de área e rotas de fuga',
    slug: 'nr23-abandono-area',
    summary:
      'Sequência de estudo para reforçar evacuação, pontos de encontro e comunicação inicial.',
    level: 'operational',
    imageUrl: fireExtinguisher,
  },
  {
    id: 'track-nr10-foundations',
    moduleId: 'module-nr-10',
    title: 'Fundamentos de segurança elétrica',
    slug: 'nr10-fundamentos',
    summary:
      'Trilha de base com materiais, checklist e simulação para equipes expostas à eletricidade.',
    level: 'introductory',
    imageUrl: nr10Intro,
  },
  {
    id: 'track-nr10-risk-reading',
    moduleId: 'module-nr-10',
    title: 'Leitura de risco elétrico em campo',
    slug: 'nr10-leitura-risco',
    summary:
      'Trilha operacional com apoio visual e prática no Meta Quest para tomada de decisão em risco elétrico.',
    level: 'advanced',
    imageUrl: nr10Risks,
  },
  {
    id: 'track-nr33-entry',
    moduleId: 'module-nr-33',
    title: 'Entrada e permanência em espaço confinado',
    slug: 'nr33-entrada-segura',
    summary:
      'Preparação teórica e prática para permissão de entrada, monitoração da atmosfera e resgate.',
    level: 'introductory',
    imageUrl: nr10Best,
  },
];

export const studyLessonsSeed: StudyLessonRecord[] = [
  {
    id: 'lesson-nr23-fire-classes',
    trackId: 'track-nr23-first-response',
    order: 1,
    title: 'Classes de fogo e escolha inicial',
    description: 'Leia o guia rápido antes de avançar para a simulação.',
    kind: 'study_material',
    required: true,
    durationMinutes: 12,
    materialId: 'material-nr23-fire-classes-pdf',
  },
  {
    id: 'lesson-nr23-extinguisher',
    trackId: 'track-nr23-first-response',
    order: 2,
    title: 'Prática: escolha e uso do extintor',
    description: 'Realize a simulação e registre uma tentativa válida.',
    kind: 'immersive_training',
    required: true,
    durationMinutes: 30,
    immersiveTrainingId: 'immersive-nr23-extinguisher',
  },
  {
    id: 'lesson-nr23-inspection',
    trackId: 'track-nr23-first-response',
    order: 3,
    title: 'Prática: inspeção inicial da área',
    description: 'Revise riscos e rotas antes de executar a resposta.',
    kind: 'immersive_training',
    required: true,
    durationMinutes: 20,
    immersiveTrainingId: 'immersive-nr23-inspection',
  },
  {
    id: 'lesson-nr23-evacuation-map',
    trackId: 'track-nr23-evacuation',
    order: 1,
    title: 'Mapa de abandono e ponto de encontro',
    description: 'Analise o material visual com rotas e pontos de segurança.',
    kind: 'study_material',
    required: true,
    durationMinutes: 10,
    materialId: 'material-nr23-evacuation-image',
  },
  {
    id: 'lesson-nr10-foundations-video',
    trackId: 'track-nr10-foundations',
    order: 1,
    title: 'Fundamentos da NR-10',
    description: 'Assista ao vídeo introdutório antes da prática.',
    kind: 'study_material',
    required: true,
    durationMinutes: 15,
    materialId: 'material-nr10-intro-video',
  },
  {
    id: 'lesson-nr10-checklist',
    trackId: 'track-nr10-foundations',
    order: 2,
    title: 'Checklist operacional',
    description: 'Revise a sequência de bloqueio e etiquetagem.',
    kind: 'study_material',
    required: true,
    durationMinutes: 8,
    materialId: 'material-nr10-checklist-link',
  },
  {
    id: 'lesson-nr10-intro-practice',
    trackId: 'track-nr10-foundations',
    order: 3,
    title: 'Prática: introdução à NR-10',
    description: 'Execute a atividade imersiva para consolidar os conceitos.',
    kind: 'immersive_training',
    required: true,
    durationMinutes: 25,
    immersiveTrainingId: 'immersive-nr10-intro',
  },
  {
    id: 'lesson-nr10-risk-meta',
    trackId: 'track-nr10-risk-reading',
    order: 1,
    title: 'Prática no Meta Quest: riscos elétricos',
    description: 'Abra o app Immersia no Meta Quest para a leitura de risco.',
    kind: 'immersive_training',
    required: true,
    durationMinutes: 40,
    immersiveTrainingId: 'immersive-nr10-risks-meta',
  },
  {
    id: 'lesson-nr33-entry-pdf',
    trackId: 'track-nr33-entry',
    order: 1,
    title: 'Permissão de entrada e trabalho',
    description: 'Estude o guia antes de avançar para a prática no Meta Quest.',
    kind: 'study_material',
    required: true,
    durationMinutes: 15,
    materialId: 'material-nr33-entry-pdf',
  },
  {
    id: 'lesson-nr33-entry-meta',
    trackId: 'track-nr33-entry',
    order: 2,
    title: 'Prática no Meta Quest: entrada segura',
    description: 'Simulação de entrada em espaço confinado com vigia e monitoração da atmosfera.',
    kind: 'immersive_training',
    required: true,
    durationMinutes: 30,
    immersiveTrainingId: 'immersive-nr33-entry-meta',
  },
];

export const trackAssignmentsSeed: TrackAssignmentRecord[] = [
  {
    id: 'assignment-brigade-a-nr23-first-response',
    groupId: 'group-brigade-a',
    trackId: 'track-nr23-first-response',
    assignedByUserId: 'user-org-admin-1',
    assignedAt: '2026-03-18T12:00:00Z',
  },
  {
    id: 'assignment-electrical-nr23-first-response',
    groupId: 'group-electrical-maintenance',
    trackId: 'track-nr23-first-response',
    assignedByUserId: 'user-instructor-2',
    assignedAt: '2026-03-25T12:00:00Z',
  },
  {
    id: 'assignment-electrical-nr23-evacuation',
    groupId: 'group-electrical-maintenance',
    trackId: 'track-nr23-evacuation',
    assignedByUserId: 'user-instructor-2',
    assignedAt: '2026-04-02T12:00:00Z',
  },
  {
    id: 'assignment-refresh-nr23-evacuation',
    groupId: 'group-nr23-refresh',
    trackId: 'track-nr23-evacuation',
    assignedByUserId: 'user-instructor-1',
    assignedAt: '2026-01-10T12:00:00Z',
  },
  {
    id: 'assignment-atlas-nr23-first-response',
    groupId: 'group-usina-atlas-a',
    trackId: 'track-nr23-first-response',
    assignedByUserId: 'user-org-admin-2',
    assignedAt: '2026-03-20T12:00:00Z',
  },
];

export const lessonProgressSeed: LessonProgressRecord[] = [
  {
    id: 'progress-paula-fire-classes',
    learnerId: 'user-learner-1',
    lessonId: 'lesson-nr23-fire-classes',
    status: 'completed',
    startedAt: '2026-04-02T11:30:00Z',
    completedAt: '2026-04-02T11:45:00Z',
  },
  {
    id: 'progress-paula-extinguisher',
    learnerId: 'user-learner-1',
    lessonId: 'lesson-nr23-extinguisher',
    status: 'completed',
    startedAt: '2026-04-03T13:00:00Z',
    completedAt: '2026-04-08T14:45:00Z',
  },
  {
    id: 'progress-paula-inspection',
    learnerId: 'user-learner-1',
    lessonId: 'lesson-nr23-inspection',
    status: 'in_progress',
    startedAt: '2026-04-09T11:20:00Z',
    completedAt: null,
  },
  {
    id: 'progress-diego-fire-classes',
    learnerId: 'user-learner-3',
    lessonId: 'lesson-nr23-fire-classes',
    status: 'completed',
    startedAt: '2026-04-04T12:30:00Z',
    completedAt: '2026-04-04T12:48:00Z',
  },
  {
    id: 'progress-diego-extinguisher',
    learnerId: 'user-learner-3',
    lessonId: 'lesson-nr23-extinguisher',
    status: 'completed',
    startedAt: '2026-04-05T15:40:00Z',
    completedAt: '2026-04-09T15:40:00Z',
  },
  {
    id: 'progress-fernanda-fire-classes',
    learnerId: 'user-learner-4',
    lessonId: 'lesson-nr23-fire-classes',
    status: 'completed',
    startedAt: '2026-04-03T14:10:00Z',
    completedAt: '2026-04-03T14:30:00Z',
  },
  {
    id: 'progress-fernanda-evacuation-map',
    learnerId: 'user-learner-4',
    lessonId: 'lesson-nr23-evacuation-map',
    status: 'in_progress',
    startedAt: '2026-04-09T18:00:00Z',
    completedAt: null,
  },
  {
    id: 'progress-kelly-fire-classes',
    learnerId: 'user-learner-2',
    lessonId: 'lesson-nr23-fire-classes',
    status: 'completed',
    startedAt: '2026-04-01T12:00:00Z',
    completedAt: '2026-04-01T12:15:00Z',
  },
];

export const trainingAttemptsSeed: TrainingAttemptRecord[] = [
  {
    id: 'attempt-1',
    learnerId: 'user-learner-1',
    organizationId: 'org-1',
    groupId: 'group-brigade-a',
    moduleId: 'module-nr-23',
    trainingId: 'nr23-1',
    attemptNumber: 1,
    score: 72,
    correctAnswers: 8,
    totalQuestions: 10,
    responseTimeMinutes: 18,
    criticalErrors: 1,
    hintsUsed: 2,
    completedAt: '2026-04-03T13:20:00Z',
    outcome: 'approved',
    report:
      'Paula identificou corretamente o foco de incêndio, mas precisou de reforço na escolha inicial do extintor. Após feedback, corrigiu a decisão e concluiu a sequência operacional com segurança.',
  },
  {
    id: 'attempt-2',
    learnerId: 'user-learner-1',
    organizationId: 'org-1',
    groupId: 'group-brigade-a',
    moduleId: 'module-nr-23',
    trainingId: 'nr23-1',
    attemptNumber: 2,
    score: 88,
    correctAnswers: 9,
    totalQuestions: 10,
    responseTimeMinutes: 14,
    criticalErrors: 0,
    hintsUsed: 1,
    completedAt: '2026-04-08T14:45:00Z',
    outcome: 'approved',
    report:
      'Paula demonstrou evolução em relação à tentativa anterior, selecionando o extintor correto com menos hesitação e mantendo a sequência de resposta dentro do tempo esperado.',
  },
  {
    id: 'attempt-4',
    learnerId: 'user-learner-3',
    organizationId: 'org-1',
    groupId: 'group-brigade-a',
    moduleId: 'module-nr-23',
    trainingId: 'nr23-1',
    attemptNumber: 1,
    score: 61,
    correctAnswers: 6,
    totalQuestions: 10,
    responseTimeMinutes: 21,
    criticalErrors: 2,
    hintsUsed: 3,
    completedAt: '2026-04-05T16:10:00Z',
    outcome: 'needs_attention',
    report:
      'Diego hesitou na classificação do fogo e selecionou um equipamento inadequado na primeira decisão crítica. O treinamento deve ser repetido com foco em classes de incêndio.',
  },
  {
    id: 'attempt-5',
    learnerId: 'user-learner-3',
    organizationId: 'org-1',
    groupId: 'group-brigade-a',
    moduleId: 'module-nr-23',
    trainingId: 'nr23-2',
    attemptNumber: 1,
    score: 58,
    correctAnswers: 6,
    totalQuestions: 12,
    responseTimeMinutes: 25,
    criticalErrors: 3,
    hintsUsed: 4,
    completedAt: '2026-04-07T11:25:00Z',
    outcome: 'needs_attention',
    report:
      'Diego deixou de verificar rotas de fuga antes da ação inicial e acumulou erros em etapas de inspeção do ambiente. Recomenda-se reforço antes de avançar para cenários complexos.',
  },
  {
    id: 'attempt-6',
    learnerId: 'user-learner-3',
    organizationId: 'org-1',
    groupId: 'group-brigade-a',
    moduleId: 'module-nr-23',
    trainingId: 'nr23-1',
    attemptNumber: 2,
    score: 74,
    correctAnswers: 8,
    totalQuestions: 10,
    responseTimeMinutes: 17,
    criticalErrors: 1,
    hintsUsed: 2,
    completedAt: '2026-04-09T15:40:00Z',
    outcome: 'approved',
    report:
      'Diego melhorou a escolha do equipamento e reduziu o tempo de resposta, mas ainda apresentou hesitação antes de confirmar a ação final. Manter acompanhamento nas próximas execuções.',
  },
  {
    id: 'attempt-8',
    learnerId: 'user-learner-4',
    organizationId: 'org-1',
    groupId: 'group-electrical-maintenance',
    moduleId: 'module-nr-23',
    trainingId: 'nr23-1',
    attemptNumber: 1,
    score: 94,
    correctAnswers: 10,
    totalQuestions: 10,
    responseTimeMinutes: 13,
    criticalErrors: 0,
    hintsUsed: 0,
    completedAt: '2026-04-06T13:20:00Z',
    outcome: 'approved',
    report:
      'Fernanda concluiu a tentativa sem erros críticos, selecionando o extintor correto e mantendo a sequência operacional esperada com tempo abaixo da média da turma.',
  },
  {
    id: 'attempt-9',
    learnerId: 'user-learner-4',
    organizationId: 'org-1',
    groupId: 'group-electrical-maintenance',
    moduleId: 'module-nr-23',
    trainingId: 'nr23-2',
    attemptNumber: 1,
    score: 89,
    correctAnswers: 11,
    totalQuestions: 12,
    responseTimeMinutes: 17,
    criticalErrors: 0,
    hintsUsed: 1,
    completedAt: '2026-04-09T17:05:00Z',
    outcome: 'approved',
    report:
      'Fernanda executou a inspeção inicial com boa cobertura do ambiente, identificando rotas de fuga e riscos principais. Pequenos atrasos ocorreram em verificações secundárias.',
  },
  {
    id: 'attempt-10',
    learnerId: 'user-learner-2',
    organizationId: 'org-2',
    groupId: 'group-usina-atlas-a',
    moduleId: 'module-nr-23',
    trainingId: 'nr23-1',
    attemptNumber: 1,
    score: 67,
    correctAnswers: 7,
    totalQuestions: 10,
    responseTimeMinutes: 19,
    criticalErrors: 1,
    hintsUsed: 2,
    completedAt: '2026-04-02T13:10:00Z',
    outcome: 'needs_attention',
    report:
      'Kelly concluiu a experiência, mas apresentou erro crítico na seleção do extintor e precisou de apoio para finalizar a sequência. Recomenda-se nova tentativa com revisão prévia.',
  },
];
