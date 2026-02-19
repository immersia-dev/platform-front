// ─── Tipos ───────────────────────────────────────────────
export type TrainingSession = {
  id: string;
  trainingId: string;       // referência ao treinamento
  trainingTitle: string;
  module: string;            // ex.: "Combate a Incêndio", "NR-10"
  date: string;              // ISO date
  durationMinutes: number;   // tempo efetivo no VR
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;          // 0-100
  avgResponseTimeSec: number;
  score: number;             // nota final 0-100
  completed: boolean;
};

export type MockStudent = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  department: string;
  sessions: TrainingSession[];
};

// ─── Helpers ─────────────────────────────────────────────
function session(
  partial: Omit<TrainingSession, 'accuracy'>,
): TrainingSession {
  return {
    ...partial,
    accuracy: Math.round((partial.correctAnswers / partial.totalQuestions) * 100),
  };
}

// ─── Dataset ─────────────────────────────────────────────
export const mockStudents: MockStudent[] = [
  {
    id: 's1',
    name: 'Carlos Eduardo Silva',
    email: 'carlos.silva@empresa.com',
    department: 'Operações',
    sessions: [
      session({
        id: 'ss-1-1',
        trainingId: 'fire-1',
        trainingTitle: 'Seleção do extintor correto',
        module: 'Combate a Incêndio',
        date: '2026-02-10',
        durationMinutes: 28,
        totalQuestions: 10,
        correctAnswers: 9,
        avgResponseTimeSec: 4.2,
        score: 92,
        completed: true,
      }),
      session({
        id: 'ss-1-2',
        trainingId: 'nr10-1',
        trainingTitle: 'Introdução à NR-10',
        module: 'NR-10',
        date: '2026-02-12',
        durationMinutes: 22,
        totalQuestions: 8,
        correctAnswers: 6,
        avgResponseTimeSec: 5.8,
        score: 75,
        completed: true,
      }),
      session({
        id: 'ss-1-3',
        trainingId: 'nr10-2',
        trainingTitle: 'Riscos elétricos',
        module: 'NR-10',
        date: '2026-02-15',
        durationMinutes: 38,
        totalQuestions: 12,
        correctAnswers: 10,
        avgResponseTimeSec: 4.5,
        score: 88,
        completed: true,
      }),
    ],
  },
  {
    id: 's2',
    name: 'Ana Beatriz Rocha',
    email: 'ana.rocha@empresa.com',
    department: 'Manutenção',
    sessions: [
      session({
        id: 'ss-2-1',
        trainingId: 'fire-1',
        trainingTitle: 'Seleção do extintor correto',
        module: 'Combate a Incêndio',
        date: '2026-02-08',
        durationMinutes: 26,
        totalQuestions: 10,
        correctAnswers: 10,
        avgResponseTimeSec: 3.1,
        score: 98,
        completed: true,
      }),
      session({
        id: 'ss-2-2',
        trainingId: 'nr10-1',
        trainingTitle: 'Introdução à NR-10',
        module: 'NR-10',
        date: '2026-02-11',
        durationMinutes: 24,
        totalQuestions: 8,
        correctAnswers: 7,
        avgResponseTimeSec: 4.0,
        score: 83,
        completed: true,
      }),
    ],
  },
  {
    id: 's3',
    name: 'Marcos Oliveira',
    email: 'marcos.oliveira@empresa.com',
    department: 'Operações',
    sessions: [
      session({
        id: 'ss-3-1',
        trainingId: 'fire-1',
        trainingTitle: 'Seleção do extintor correto',
        module: 'Combate a Incêndio',
        date: '2026-02-09',
        durationMinutes: 32,
        totalQuestions: 10,
        correctAnswers: 7,
        avgResponseTimeSec: 6.4,
        score: 68,
        completed: true,
      }),
      session({
        id: 'ss-3-2',
        trainingId: 'nr10-1',
        trainingTitle: 'Introdução à NR-10',
        module: 'NR-10',
        date: '2026-02-14',
        durationMinutes: 20,
        totalQuestions: 8,
        correctAnswers: 4,
        avgResponseTimeSec: 7.1,
        score: 52,
        completed: true,
      }),
      session({
        id: 'ss-3-3',
        trainingId: 'nr10-2',
        trainingTitle: 'Riscos elétricos',
        module: 'NR-10',
        date: '2026-02-17',
        durationMinutes: 40,
        totalQuestions: 12,
        correctAnswers: 8,
        avgResponseTimeSec: 5.9,
        score: 65,
        completed: false,
      }),
    ],
  },
  {
    id: 's4',
    name: 'Juliana Mendes',
    email: 'juliana.mendes@empresa.com',
    department: 'Segurança',
    sessions: [
      session({
        id: 'ss-4-1',
        trainingId: 'fire-1',
        trainingTitle: 'Seleção do extintor correto',
        module: 'Combate a Incêndio',
        date: '2026-02-07',
        durationMinutes: 24,
        totalQuestions: 10,
        correctAnswers: 10,
        avgResponseTimeSec: 2.8,
        score: 100,
        completed: true,
      }),
      session({
        id: 'ss-4-2',
        trainingId: 'nr10-1',
        trainingTitle: 'Introdução à NR-10',
        module: 'NR-10',
        date: '2026-02-10',
        durationMinutes: 21,
        totalQuestions: 8,
        correctAnswers: 8,
        avgResponseTimeSec: 3.5,
        score: 95,
        completed: true,
      }),
      session({
        id: 'ss-4-3',
        trainingId: 'nr10-2',
        trainingTitle: 'Riscos elétricos',
        module: 'NR-10',
        date: '2026-02-13',
        durationMinutes: 35,
        totalQuestions: 12,
        correctAnswers: 11,
        avgResponseTimeSec: 3.8,
        score: 93,
        completed: true,
      }),
      session({
        id: 'ss-4-4',
        trainingId: 'nr10-3',
        trainingTitle: 'Procedimentos básicos',
        module: 'NR-10',
        date: '2026-02-16',
        durationMinutes: 33,
        totalQuestions: 10,
        correctAnswers: 9,
        avgResponseTimeSec: 4.1,
        score: 90,
        completed: true,
      }),
    ],
  },
  {
    id: 's5',
    name: 'Rafael Souza',
    email: 'rafael.souza@empresa.com',
    department: 'Logística',
    sessions: [
      session({
        id: 'ss-5-1',
        trainingId: 'fire-1',
        trainingTitle: 'Seleção do extintor correto',
        module: 'Combate a Incêndio',
        date: '2026-02-11',
        durationMinutes: 30,
        totalQuestions: 10,
        correctAnswers: 8,
        avgResponseTimeSec: 5.0,
        score: 78,
        completed: true,
      }),
    ],
  },
  {
    id: 's6',
    name: 'Fernanda Costa',
    email: 'fernanda.costa@empresa.com',
    department: 'Manutenção',
    sessions: [
      session({
        id: 'ss-6-1',
        trainingId: 'fire-1',
        trainingTitle: 'Seleção do extintor correto',
        module: 'Combate a Incêndio',
        date: '2026-02-06',
        durationMinutes: 27,
        totalQuestions: 10,
        correctAnswers: 9,
        avgResponseTimeSec: 3.9,
        score: 90,
        completed: true,
      }),
      session({
        id: 'ss-6-2',
        trainingId: 'nr10-1',
        trainingTitle: 'Introdução à NR-10',
        module: 'NR-10',
        date: '2026-02-09',
        durationMinutes: 23,
        totalQuestions: 8,
        correctAnswers: 7,
        avgResponseTimeSec: 4.3,
        score: 85,
        completed: true,
      }),
      session({
        id: 'ss-6-3',
        trainingId: 'nr10-2',
        trainingTitle: 'Riscos elétricos',
        module: 'NR-10',
        date: '2026-02-14',
        durationMinutes: 37,
        totalQuestions: 12,
        correctAnswers: 9,
        avgResponseTimeSec: 5.2,
        score: 76,
        completed: true,
      }),
    ],
  },
  {
    id: 's7',
    name: 'Lucas Pereira',
    email: 'lucas.pereira@empresa.com',
    department: 'Operações',
    sessions: [
      session({
        id: 'ss-7-1',
        trainingId: 'fire-1',
        trainingTitle: 'Seleção do extintor correto',
        module: 'Combate a Incêndio',
        date: '2026-02-13',
        durationMinutes: 34,
        totalQuestions: 10,
        correctAnswers: 6,
        avgResponseTimeSec: 7.5,
        score: 55,
        completed: true,
      }),
      session({
        id: 'ss-7-2',
        trainingId: 'nr10-1',
        trainingTitle: 'Introdução à NR-10',
        module: 'NR-10',
        date: '2026-02-18',
        durationMinutes: 25,
        totalQuestions: 8,
        correctAnswers: 5,
        avgResponseTimeSec: 6.8,
        score: 60,
        completed: false,
      }),
    ],
  },
  {
    id: 's8',
    name: 'Gabriela Lima',
    email: 'gabriela.lima@empresa.com',
    department: 'Segurança',
    sessions: [
      session({
        id: 'ss-8-1',
        trainingId: 'fire-1',
        trainingTitle: 'Seleção do extintor correto',
        module: 'Combate a Incêndio',
        date: '2026-02-10',
        durationMinutes: 25,
        totalQuestions: 10,
        correctAnswers: 10,
        avgResponseTimeSec: 3.0,
        score: 97,
        completed: true,
      }),
      session({
        id: 'ss-8-2',
        trainingId: 'nr10-1',
        trainingTitle: 'Introdução à NR-10',
        module: 'NR-10',
        date: '2026-02-12',
        durationMinutes: 20,
        totalQuestions: 8,
        correctAnswers: 8,
        avgResponseTimeSec: 3.2,
        score: 96,
        completed: true,
      }),
      session({
        id: 'ss-8-3',
        trainingId: 'nr10-2',
        trainingTitle: 'Riscos elétricos',
        module: 'NR-10',
        date: '2026-02-15',
        durationMinutes: 36,
        totalQuestions: 12,
        correctAnswers: 12,
        avgResponseTimeSec: 2.9,
        score: 99,
        completed: true,
      }),
    ],
  },
];

// ─── Helpers de agregação ────────────────────────────────
export function allSessions() {
  return mockStudents.flatMap((s) => s.sessions);
}

export function completedSessions() {
  return allSessions().filter((s) => s.completed);
}

export function avgOf(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function studentAvgScore(student: MockStudent) {
  const scores = student.sessions.map((s) => s.score);
  return avgOf(scores);
}

export function studentCompletionRate(student: MockStudent) {
  if (student.sessions.length === 0) return 0;
  return (
    (student.sessions.filter((s) => s.completed).length /
      student.sessions.length) *
    100
  );
}
