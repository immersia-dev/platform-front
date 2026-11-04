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
    ownerName: 'Usuário 01',
    totalUsers: 17,
    activeModules: 3,
    status: 'active',
  },
  {
    id: 'org-2',
    name: 'Usina Atlas',
    documentNumber: '23.456.789/0001-01',
    ownerName: 'Usuário 10',
    totalUsers: 28,
    activeModules: 2,
    status: 'active',
  },
  {
    id: 'org-3',
    name: 'Logisafe Transportes',
    documentNumber: '34.567.890/0001-12',
    ownerName: 'Usuário 12',
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
    name: 'Usuário 01',
    email: 'usuario01@empresa-demo.com',
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
    name: 'Usuário 02',
    email: 'usuario02@empresa-demo.com',
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
    name: 'Usuário 03',
    email: 'usuario03@empresa-demo.com',
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
    name: 'Usuário 04',
    email: 'usuario04@empresa-demo.com',
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
    name: 'Usuário 05',
    email: 'usuario05@empresa-demo.com',
    documentNumber: '555.666.777-88',
    sex: 'female',
    birthDate: '1997-11-03',
    role: 'learner',
    organizationId: 'org-1',
    organizationName: 'Organização Demo',
    status: 'active',
    lastAccessAt: '2026-04-09T06:35:00Z',
  },
  {
    id: 'user-learner-3',
    name: 'Usuário 06',
    email: 'usuario06@empresa-demo.com',
    documentNumber: '666.777.888-99',
    sex: 'male',
    birthDate: '1995-02-26',
    role: 'learner',
    organizationId: 'org-1',
    organizationName: 'Organização Demo',
    status: 'active',
    lastAccessAt: '2026-04-09T12:55:00Z',
  },
  {
    id: 'user-learner-4',
    name: 'Usuário 07',
    email: 'usuario07@empresa-demo.com',
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
    name: 'Usuário 08',
    email: 'usuario08@empresa-demo.com',
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
    name: 'Usuário 09',
    email: 'usuario09@empresa-demo.com',
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
    name: 'Usuário 10',
    email: 'usuario10@usina-atlas.com',
    documentNumber: '123.456.789-10',
    sex: 'male',
    birthDate: '1987-10-19',
    role: 'org_admin',
    organizationId: 'org-2',
    organizationName: 'Usina Atlas',
    status: 'active',
    lastAccessAt: '2026-04-15T10:10:00Z',
  },
  {
    id: 'user-learner-2',
    name: 'Usuário 11',
    email: 'usuario11@usina-atlas.com',
    documentNumber: '234.567.891-01',
    sex: 'female',
    birthDate: '1996-06-25',
    role: 'learner',
    organizationId: 'org-2',
    organizationName: 'Usina Atlas',
    status: 'invited',
    lastAccessAt: null,
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
    description: 'Turma ativa para profissionais expostos a rotinas de instalações elétricas.',
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
    startedAt: '2026-03-18T09:00:00Z',
    endedAt: null,
  },
  {
    id: 'membership-paula-completed',
    groupId: 'group-nr23-refresh',
    learnerId: 'user-learner-1',
    status: 'completed',
    startedAt: '2026-01-10T09:00:00Z',
    endedAt: '2026-02-12T18:00:00Z',
  },
  {
    id: 'membership-diego-active',
    groupId: 'group-brigade-a',
    learnerId: 'user-learner-3',
    status: 'active',
    startedAt: '2026-03-18T09:00:00Z',
    endedAt: null,
  },
  {
    id: 'membership-fernanda-active',
    groupId: 'group-electrical-maintenance',
    learnerId: 'user-learner-4',
    status: 'active',
    startedAt: '2026-03-25T09:00:00Z',
    endedAt: null,
  },
  {
    id: 'membership-rafael-active',
    groupId: 'group-brigade-a',
    learnerId: 'user-learner-5',
    status: 'active',
    startedAt: '2026-04-01T09:00:00Z',
    endedAt: null,
  },
  {
    id: 'membership-camila-active',
    groupId: 'group-electrical-maintenance',
    learnerId: 'user-learner-6',
    status: 'active',
    startedAt: '2026-04-02T09:00:00Z',
    endedAt: null,
  },
  {
    id: 'membership-kelly-active',
    groupId: 'group-usina-atlas-a',
    learnerId: 'user-learner-2',
    status: 'active',
    startedAt: '2026-03-20T09:00:00Z',
    endedAt: null,
  },
];

export const studentGroupModuleAccessSeed: StudentGroupModuleAccessRecord[] = [
  {
    id: 'group-module-brigade-a-nr23',
    groupId: 'group-brigade-a',
    moduleId: 'module-nr-23',
    assignedAt: '2026-03-18T09:00:00Z',
  },
  {
    id: 'group-module-brigade-a-nr10',
    groupId: 'group-brigade-a',
    moduleId: 'module-nr-10',
    assignedAt: '2026-04-01T09:00:00Z',
  },
  {
    id: 'group-module-electrical-nr10',
    groupId: 'group-electrical-maintenance',
    moduleId: 'module-nr-10',
    assignedAt: '2026-03-25T09:00:00Z',
  },
  {
    id: 'group-module-electrical-nr23',
    groupId: 'group-electrical-maintenance',
    moduleId: 'module-nr-23',
    assignedAt: '2026-04-02T09:00:00Z',
  },
  {
    id: 'group-module-refresh-nr23',
    groupId: 'group-nr23-refresh',
    moduleId: 'module-nr-23',
    assignedAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'group-module-atlas-nr23',
    groupId: 'group-usina-atlas-a',
    moduleId: 'module-nr-23',
    assignedAt: '2026-03-20T09:00:00Z',
  },
];

export const modulesSeed: ModuleRecord[] = [
  {
    id: 'module-nr-23',
    name: 'NR-23',
    slug: 'nr-23',
    summary:
      'Treinamentos para prevenção e combate a incêndio, resposta inicial e uso correto de equipamentos.',
    organizationIds: ['org-1', 'org-2', 'org-3'],
    trainings: [
      {
        id: 'nr23-1',
        title: 'Seleção do extintor correto',
        description:
          'Identifique a classe do fogo e selecione o extintor mais adequado para cada ocorrência.',
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
      {
        id: 'nr23-3',
        title: 'Resposta ao princípio de incêndio',
        description:
          'Treine a sequência operacional esperada para os primeiros minutos da ocorrência.',
        minutes: 35,
        completed: false,
        modality: 'VR',
        url: 'https://example.com/nr23-3',
        enabled: false,
        imageUrl: fireExtinguisher,
      },
      {
        id: 'nr23-4',
        title: 'Abandono de área em emergência',
        description:
          'Revise a lógica de evacuação e conduza a saída com segurança até o ponto de encontro.',
        minutes: 18,
        completed: false,
        modality: 'VR',
        url: 'https://example.com/nr23-4',
        enabled: false,
        imageUrl: fireExtinguisher,
      },
    ],
  },
  {
    id: 'module-nr-10',
    name: 'NR-10',
    slug: 'nr-10',
    summary:
      'Treinamentos voltados à segurança em instalações e serviços com eletricidade.',
    organizationIds: ['org-1', 'org-2'],
    trainings: [
      {
        id: 'nr10-1',
        title: 'Introdução à NR-10',
        description:
          'Revise conceitos, responsabilidades e critérios mínimos exigidos na operação.',
        minutes: 25,
        completed: false,
        modality: 'VR',
        url: 'https://example.com/nr10-1',
        enabled: true,
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
        url: 'https://example.com/nr10-2',
        enabled: false,
        imageUrl: nr10Risks,
      },
      {
        id: 'nr10-3',
        title: 'Procedimentos básicos',
        description:
          'Pratique rotinas seguras e decisões esperadas durante a execução do serviço.',
        minutes: 35,
        completed: false,
        modality: 'VR',
        url: 'https://example.com/nr10-3',
        enabled: false,
        imageUrl: nr10Best,
      },
    ],
  },
  {
    id: 'module-nr-35',
    name: 'NR-35',
    slug: 'nr-35',
    summary:
      'Treinamentos para trabalho em altura, avaliação de risco e preparação da atividade.',
    organizationIds: ['org-1'],
    trainings: [
      {
        id: 'nr35-1',
        title: 'Planejamento da atividade',
        description:
          'Revise permissões, análise preliminar e preparação antes da execução em altura.',
        minutes: 24,
        completed: false,
        modality: 'VR',
        url: 'https://example.com/nr35-1',
        enabled: false,
        imageUrl: nr10Best,
      },
      {
        id: 'nr35-2',
        title: 'Uso correto de ancoragem',
        description:
          'Treine a escolha do ponto de ancoragem e a checagem de equipamentos obrigatórios.',
        minutes: 28,
        completed: false,
        modality: 'VR',
        url: 'https://example.com/nr35-2',
        enabled: false,
        imageUrl: nr10Intro,
      },
    ],
  },
];

export const studyMaterialsSeed: StudyMaterialRecord[] = [
  {
    id: 'material-nr23-fire-classes-pdf',
    kind: 'pdf',
    title: 'Guia rapido de classes de incendio',
    description:
      'Material de apoio para reconhecer classes de fogo e criterios de escolha do extintor.',
    url: 'https://example.com/materials/nr23-classes-incendio.pdf',
    thumbnailUrl: fireExtinguisher,
  },
  {
    id: 'material-nr23-evacuation-image',
    kind: 'image',
    title: 'Mapa visual de abandono de area',
    description:
      'Imagem de referencia com pontos de encontro, rotas de fuga e sinalizacao essencial.',
    url: fireExtinguisher,
    thumbnailUrl: fireExtinguisher,
  },
  {
    id: 'material-nr10-intro-video',
    kind: 'video',
    title: 'Fundamentos da NR-10',
    description:
      'Video curto para alinhar responsabilidades, autorizacao e riscos eletricos recorrentes.',
    url: 'https://example.com/videos/nr10-fundamentos',
    thumbnailUrl: nr10Intro,
  },
  {
    id: 'material-nr10-checklist-link',
    kind: 'link',
    title: 'Checklist de bloqueio e etiquetagem',
    description:
      'Referencia externa para revisar uma sequencia segura antes da atividade eletrica.',
    url: 'https://example.com/checklists/bloqueio-etiquetagem',
    thumbnailUrl: nr10Best,
  },
  {
    id: 'material-nr35-planning-pdf',
    kind: 'pdf',
    title: 'Planejamento de trabalho em altura',
    description:
      'Resumo de permissao de trabalho, analise preliminar de risco e pontos de ancoragem.',
    url: 'https://example.com/materials/nr35-planejamento.pdf',
    thumbnailUrl: nr10Best,
  },
];

export const immersiveTrainingsSeed: ImmersiveTrainingRecord[] = [
  {
    id: 'immersive-nr23-extinguisher',
    moduleId: 'module-nr-23',
    title: 'Selecao do extintor correto',
    description:
      'Simulacao em A-frame para identificar a classe do fogo e escolher o equipamento adequado.',
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
    title: 'Inspecao inicial da area',
    description:
      'Experiencia web para reconhecer riscos, rotas de fuga e condicoes do ambiente.',
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
    title: 'Introducao a NR-10',
    description:
      'Atividade guiada para revisar conceitos, responsabilidades e criterios minimos.',
    minutes: 25,
    launchType: 'web_url',
    launchUrl: 'https://example.com/nr10-1',
    enabled: true,
    imageUrl: nr10Intro,
    legacyTrainingId: 'nr10-1',
  },
  {
    id: 'immersive-nr10-risks-meta',
    moduleId: 'module-nr-10',
    title: 'Riscos eletricos no headset',
    description:
      'Aplicacao Meta para praticar leitura de riscos eletricos em cenarios criticos.',
    minutes: 40,
    launchType: 'meta_app',
    launchUrl: 'immersia-meta://training/nr10-risks',
    enabled: true,
    imageUrl: nr10Risks,
    legacyTrainingId: 'nr10-2',
  },
  {
    id: 'immersive-nr35-anchor-meta',
    moduleId: 'module-nr-35',
    title: 'Uso correto de ancoragem',
    description:
      'Aplicacao Meta em preparacao para praticar escolha e checagem de pontos de ancoragem.',
    minutes: 28,
    launchType: 'meta_app',
    launchUrl: '',
    enabled: false,
    imageUrl: nr10Best,
    legacyTrainingId: 'nr35-2',
  },
];

export const studyTracksSeed: StudyTrackRecord[] = [
  {
    id: 'track-nr23-first-response',
    moduleId: 'module-nr-23',
    title: 'Resposta inicial a principio de incendio',
    slug: 'nr23-resposta-inicial',
    summary:
      'Trilha para preparar alunos antes da pratica de selecao de extintor e inspecao da area.',
    level: 'introductory',
    imageUrl: fireExtinguisher,
  },
  {
    id: 'track-nr23-evacuation',
    moduleId: 'module-nr-23',
    title: 'Abandono de area e rotas de fuga',
    slug: 'nr23-abandono-area',
    summary:
      'Sequencia de estudo para reforcar evacuacao, pontos de encontro e comunicacao inicial.',
    level: 'operational',
    imageUrl: fireExtinguisher,
  },
  {
    id: 'track-nr10-foundations',
    moduleId: 'module-nr-10',
    title: 'Fundamentos de seguranca eletrica',
    slug: 'nr10-fundamentos',
    summary:
      'Trilha de base com materiais, checklist e simulacao para equipes expostas a eletricidade.',
    level: 'introductory',
    imageUrl: nr10Intro,
  },
  {
    id: 'track-nr10-risk-reading',
    moduleId: 'module-nr-10',
    title: 'Leitura de risco eletrico em campo',
    slug: 'nr10-leitura-risco',
    summary:
      'Trilha operacional com apoio visual e atividade Meta para tomada de decisao em risco eletrico.',
    level: 'advanced',
    imageUrl: nr10Risks,
  },
  {
    id: 'track-nr35-planning',
    moduleId: 'module-nr-35',
    title: 'Planejamento de trabalho em altura',
    slug: 'nr35-planejamento',
    summary:
      'Preparacao teorica para permissao de trabalho, analise preliminar e ancoragem.',
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
    description: 'Leia o guia rapido antes de avancar para a simulacao.',
    kind: 'study_material',
    required: true,
    durationMinutes: 12,
    materialId: 'material-nr23-fire-classes-pdf',
  },
  {
    id: 'lesson-nr23-extinguisher',
    trackId: 'track-nr23-first-response',
    order: 2,
    title: 'Pratica: selecao do extintor',
    description: 'Realize a simulacao web e registre uma tentativa valida.',
    kind: 'immersive_training',
    required: true,
    durationMinutes: 30,
    immersiveTrainingId: 'immersive-nr23-extinguisher',
  },
  {
    id: 'lesson-nr23-inspection',
    trackId: 'track-nr23-first-response',
    order: 3,
    title: 'Pratica: inspecao inicial da area',
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
    description: 'Analise o material visual com rotas e pontos de seguranca.',
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
    description: 'Assista ao video introdutorio antes da pratica.',
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
    description: 'Revise a sequencia de bloqueio e etiquetagem.',
    kind: 'study_material',
    required: true,
    durationMinutes: 8,
    materialId: 'material-nr10-checklist-link',
  },
  {
    id: 'lesson-nr10-intro-practice',
    trackId: 'track-nr10-foundations',
    order: 3,
    title: 'Pratica: introducao a NR-10',
    description: 'Execute a atividade web para consolidar os conceitos.',
    kind: 'immersive_training',
    required: true,
    durationMinutes: 25,
    immersiveTrainingId: 'immersive-nr10-intro',
  },
  {
    id: 'lesson-nr10-risk-meta',
    trackId: 'track-nr10-risk-reading',
    order: 1,
    title: 'Pratica Meta: riscos eletricos',
    description: 'Abra a aplicacao Meta configurada para leitura de risco.',
    kind: 'immersive_training',
    required: true,
    durationMinutes: 40,
    immersiveTrainingId: 'immersive-nr10-risks-meta',
  },
  {
    id: 'lesson-nr35-planning-pdf',
    trackId: 'track-nr35-planning',
    order: 1,
    title: 'Planejamento e permissao de trabalho',
    description: 'Estude o guia antes de avancar para a pratica Meta.',
    kind: 'study_material',
    required: true,
    durationMinutes: 18,
    materialId: 'material-nr35-planning-pdf',
  },
  {
    id: 'lesson-nr35-anchor-meta',
    trackId: 'track-nr35-planning',
    order: 2,
    title: 'Pratica Meta: ancoragem',
    description: 'Atividade Meta em preparacao para o modulo de trabalho em altura.',
    kind: 'immersive_training',
    required: true,
    durationMinutes: 28,
    immersiveTrainingId: 'immersive-nr35-anchor-meta',
  },
];

export const trackAssignmentsSeed: TrackAssignmentRecord[] = [
  {
    id: 'assignment-brigade-a-nr23-first-response',
    groupId: 'group-brigade-a',
    trackId: 'track-nr23-first-response',
    assignedByUserId: 'user-org-admin-1',
    assignedAt: '2026-03-18T09:00:00Z',
  },
  {
    id: 'assignment-electrical-nr10-foundations',
    groupId: 'group-electrical-maintenance',
    trackId: 'track-nr10-foundations',
    assignedByUserId: 'user-instructor-2',
    assignedAt: '2026-03-25T09:00:00Z',
  },
  {
    id: 'assignment-electrical-nr10-risk-reading',
    groupId: 'group-electrical-maintenance',
    trackId: 'track-nr10-risk-reading',
    assignedByUserId: 'user-instructor-2',
    assignedAt: '2026-04-02T09:00:00Z',
  },
  {
    id: 'assignment-refresh-nr23-evacuation',
    groupId: 'group-nr23-refresh',
    trackId: 'track-nr23-evacuation',
    assignedByUserId: 'user-instructor-1',
    assignedAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'assignment-atlas-nr23-first-response',
    groupId: 'group-usina-atlas-a',
    trackId: 'track-nr23-first-response',
    assignedByUserId: 'user-org-admin-2',
    assignedAt: '2026-03-20T09:00:00Z',
  },
];

export const lessonProgressSeed: LessonProgressRecord[] = [
  {
    id: 'progress-paula-fire-classes',
    learnerId: 'user-learner-1',
    lessonId: 'lesson-nr23-fire-classes',
    status: 'completed',
    startedAt: '2026-04-02T08:30:00Z',
    completedAt: '2026-04-02T08:45:00Z',
  },
  {
    id: 'progress-paula-extinguisher',
    learnerId: 'user-learner-1',
    lessonId: 'lesson-nr23-extinguisher',
    status: 'completed',
    startedAt: '2026-04-03T10:00:00Z',
    completedAt: '2026-04-08T14:45:00Z',
  },
  {
    id: 'progress-paula-inspection',
    learnerId: 'user-learner-1',
    lessonId: 'lesson-nr23-inspection',
    status: 'in_progress',
    startedAt: '2026-04-09T08:20:00Z',
    completedAt: null,
  },
  {
    id: 'progress-diego-fire-classes',
    learnerId: 'user-learner-3',
    lessonId: 'lesson-nr23-fire-classes',
    status: 'completed',
    startedAt: '2026-04-04T09:30:00Z',
    completedAt: '2026-04-04T09:48:00Z',
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
    id: 'progress-fernanda-nr10-video',
    learnerId: 'user-learner-4',
    lessonId: 'lesson-nr10-foundations-video',
    status: 'completed',
    startedAt: '2026-04-03T11:10:00Z',
    completedAt: '2026-04-03T11:30:00Z',
  },
  {
    id: 'progress-fernanda-nr10-checklist',
    learnerId: 'user-learner-4',
    lessonId: 'lesson-nr10-checklist',
    status: 'completed',
    startedAt: '2026-04-03T11:35:00Z',
    completedAt: '2026-04-03T11:46:00Z',
  },
  {
    id: 'progress-fernanda-nr10-practice',
    learnerId: 'user-learner-4',
    lessonId: 'lesson-nr10-intro-practice',
    status: 'completed',
    startedAt: '2026-04-04T08:30:00Z',
    completedAt: '2026-04-04T08:55:00Z',
  },
  {
    id: 'progress-fernanda-nr10-risk',
    learnerId: 'user-learner-4',
    lessonId: 'lesson-nr10-risk-meta',
    status: 'in_progress',
    startedAt: '2026-04-09T16:00:00Z',
    completedAt: null,
  },
  {
    id: 'progress-kelly-fire-classes',
    learnerId: 'user-learner-2',
    lessonId: 'lesson-nr23-fire-classes',
    status: 'completed',
    startedAt: '2026-04-01T09:00:00Z',
    completedAt: '2026-04-01T09:15:00Z',
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
    completedAt: '2026-04-03T10:20:00Z',
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
    id: 'attempt-3',
    learnerId: 'user-learner-1',
    organizationId: 'org-1',
    groupId: 'group-brigade-a',
    moduleId: 'module-nr-10',
    trainingId: 'nr10-1',
    attemptNumber: 1,
    score: 64,
    correctAnswers: 7,
    totalQuestions: 12,
    responseTimeMinutes: 22,
    criticalErrors: 2,
    hintsUsed: 3,
    completedAt: '2026-04-09T09:30:00Z',
    outcome: 'needs_attention',
    report:
      'Paula apresentou dificuldade em reconhecer sinais de risco elétrico e levou mais tempo para confirmar decisões críticas. Recomenda-se revisão guiada dos conceitos iniciais da NR-10.',
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
    id: 'attempt-7',
    learnerId: 'user-learner-4',
    organizationId: 'org-1',
    groupId: 'group-electrical-maintenance',
    moduleId: 'module-nr-10',
    trainingId: 'nr10-1',
    attemptNumber: 1,
    score: 91,
    correctAnswers: 11,
    totalQuestions: 12,
    responseTimeMinutes: 16,
    criticalErrors: 0,
    hintsUsed: 1,
    completedAt: '2026-04-04T08:55:00Z',
    outcome: 'approved',
    report:
      'Fernanda reconheceu corretamente os riscos elétricos apresentados e seguiu a sequência de resposta com boa precisão. O desempenho indica domínio inicial do módulo.',
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
    completedAt: '2026-04-02T10:10:00Z',
    outcome: 'needs_attention',
    report:
      'Kelly concluiu a experiência, mas apresentou erro crítico na seleção do extintor e precisou de apoio para finalizar a sequência. Recomenda-se nova tentativa com revisão prévia.',
  },
];
