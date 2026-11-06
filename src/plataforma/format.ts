import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  ClientHealth,
  ClassRisk,
  CompetencyLevel,
  ComplianceRow,
  ComplianceStatus,
  LearnerSignal,
  LearningPath,
  VrStatus,
} from './api';
import { API_URL, errorText } from './api';

// Textos, formatos e utilidades das telas da plataforma (os componentes ficam em ui.tsx).

export const complianceLabels: Record<ComplianceStatus, string> = {
  pendente: 'Não iniciado',
  em_andamento: 'Em andamento',
  revisar: 'Revisar',
  apto: 'Apto',
  a_vencer: 'A vencer',
  vencido: 'Vencido',
};

export const complianceHelp: Record<ComplianceStatus, string> = {
  pendente: 'Nenhuma etapa concluída.',
  em_andamento: 'Parte das etapas concluída.',
  revisar: 'Concluiu tudo, mas nenhuma tentativa no VR atingiu o critério.',
  apto: 'Concluiu todas as etapas e atingiu o critério no VR.',
  a_vencer: 'Apto, mas a validade termina em até 30 dias.',
  vencido: 'A validade terminou: precisa fazer a reciclagem.',
};

export const compliancePill: Record<ComplianceStatus, string> = {
  pendente: 'status-pill status-pill-muted',
  em_andamento: 'status-pill border-cyan-300/20 bg-cyan-400/10 text-cyan-100',
  revisar: 'status-pill border-amber-300/25 bg-amber-400/10 text-amber-100',
  apto: 'status-pill status-pill-success',
  a_vencer: 'status-pill border-amber-300/25 bg-amber-400/10 text-amber-100',
  vencido: 'status-pill border-rose-300/20 bg-rose-400/10 text-rose-100',
};

export const vrStatusLabels: Record<VrStatus, string> = {
  pending: 'Aguardando no Quest',
  running: 'Em andamento',
  completed: 'Encerrada',
  cancelled: 'Cancelada',
  expired: 'Expirada',
};

export const stepLabels: Record<string, string> = {
  briefing: 'Orientação inicial',
  alarm: 'Acionar o alarme',
  escape_route: 'Rota de fuga',
  assess_risk: 'Avaliar o risco',
  identify: 'Identificar a classe do fogo',
  select: 'Escolher o extintor',
  remove_seal: 'Romper o lacre',
  hold_nozzle: 'Empunhar a mangueira',
  test_trigger: 'Testar o gatilho',
  approach: 'Aproximar com segurança',
  discharge: 'Combater o foco',
  observe: 'Observar o rescaldo',
  evacuate: 'Abandonar o local',
  geral: 'Geral',
};

export const competencyLabels: Record<string, string> = {
  reconhecimento: 'Reconhecimento do cenário',
  alarme: 'Acionamento do alarme',
  rota_de_fuga: 'Rota de fuga',
  avaliacao_de_risco: 'Avaliação de risco',
  classe_do_fogo: 'Classe do fogo',
  escolha_do_extintor: 'Escolha do extintor',
  operacao_extintor: 'Operação do extintor',
  distancia_segura: 'Distância segura',
  tecnica_de_combate: 'Técnica de combate',
  rescaldo: 'Rescaldo',
  abandono: 'Abandono do local',
};

export const errorLabels: Record<string, string> = {
  blocked_route: 'Seguiu por rota tomada pela fumaça',
  burn_contact: 'Contato com as chamas',
  heat_proximity: 'Ficou perto demais do calor',
  unsafe_combat: 'Combateu um incêndio que já não era inicial',
  elevator_called: 'Chamou o elevador durante o incêndio',
  elevator_used: 'Usou o elevador durante o incêndio',
  elevator_entered: 'Entrou no elevador durante o incêndio',
  extinguisher_empty: 'Esgotou a carga do extintor',
  unsafe_discharge_distance: 'Disparou abaixo da distância segura',
  unsuitable_agent: 'Usou extintor inadequado',
  incorrect_action: 'Ação incorreta',
};

export const trainingNames: Record<string, string> = {
  'fire-class-a': 'Incêndio classe A · escritório',
};

export const label = (
  map: Record<string, string>,
  key: string | null | undefined
) => (key ? (map[key] ?? key.replace(/_/g, ' ')) : '—');

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (value: string | null | undefined) =>
  value ? dateFmt.format(new Date(value)) : '—';
export const formatDateTime = (value: string | null | undefined) =>
  value ? dateTimeFmt.format(new Date(value)) : '—';

export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m ? `${m} min ${s.toString().padStart(2, '0')} s` : `${s} s`;
}

export function formatScore(value: string | number | null | undefined) {
  if (value == null || value === '') return '—';
  return `${Math.round(Number(value))}`;
}

export function formatHours(value: string | number | null | undefined) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  return `${Number.isInteger(n) ? n : n.toLocaleString('pt-BR')} h`;
}

export const formatCpf = (cpf: string | null | undefined) =>
  cpf && cpf.length === 11
    ? `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`
    : (cpf ?? '');

export const formatCnpj = (cnpj: string | null | undefined) =>
  cnpj && cnpj.length === 14
    ? `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`
    : (cnpj ?? '');

export const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/** Critério do VR em poucas palavras: "mínimo 70, sem erro crítico". */
export function criterionText(
  score: string | number | null | undefined,
  critical: number | null | undefined
) {
  const errors = !critical
    ? 'sem erro crítico'
    : `até ${plural(critical, 'erro crítico', 'erros críticos')}`;
  return `mínimo ${formatScore(score)}, ${errors}`;
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((part) => part.replace(/[^\p{L}]/gu, ''))
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || '?'
  );
}

export function validityText(row: Pick<ComplianceRow, 'validity_months'>) {
  if (!row.validity_months) return 'Sem validade';
  return row.validity_months % 12 === 0
    ? `Validade de ${plural(row.validity_months / 12, 'ano', 'anos')}`
    : `Validade de ${plural(row.validity_months, 'mês', 'meses')}`;
}

/** Normaliza o código do Quest como aparece no painel: K7Q-4M2. */
export function formatCode(raw: string) {
  const clean = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  return clean.length > 3 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}

export function useLoad<T>(
  load: () => Promise<T>,
  deps: unknown[],
  refreshMs?: number
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const loader = useRef(load);
  loader.current = load;

  const reload = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      setData(await loader.current());
      setError('');
    } catch (caught) {
      setError(errorText(caught, 'Não foi possível carregar os dados.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    if (!refreshMs) return;
    const timer = window.setInterval(() => void reload(true), refreshMs);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, refreshMs, ...deps]);

  return { data, error, loading, reload, setData };
}

/** Baixa linhas como CSV (separador ;, que o Excel em pt-BR abre direto). */
export function downloadCsv(
  filename: string,
  header: string[],
  rows: (string | number | null | undefined)[][]
) {
  const cell = (v: string | number | null | undefined) => {
    const text = v == null ? '' : String(v);
    return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv =
    '\uFEFF' + [header, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' })
  );
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: filename,
  });
  link.click();
  URL.revokeObjectURL(url);
}

/** Lê um CSV (separador ; ou ,) em linhas com as colunas do cabeçalho, em minúsculas. */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (!lines.length) return [];
  const sep =
    (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0)
      ? ';'
      : ',';
  const split = (line: string) => {
    const out: string[] = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = !quoted;
      } else if (ch === sep && !quoted) {
        out.push(cur);
        cur = '';
      } else cur += ch;
    }
    out.push(cur);
    return out.map((c) => c.trim());
  };
  const header = split(lines[0]).map((h) =>
    h
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace('e-mail', 'email')
  );
  return lines.slice(1).map((line) => {
    const cells = split(line);
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
  });
}

export function verificationUrl(
  enrollmentId: string,
  classCourseId: string,
  code: string
) {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`.replace(
    /\/$/,
    ''
  );
  return `${base}/verificar/${enrollmentId}/${classCourseId}?codigo=${encodeURIComponent(code)}`;
}

// ---------------------------------------------------------------- acompanhamento (learning analytics)
export const signalLabels: Record<LearnerSignal, string> = {
  reforco: 'Precisa de reforço',
  atencao: 'Atenção',
  bom: 'Bom desempenho',
  sem_tentativa: 'Sem tentativa',
};
export const signalHelp: Record<LearnerSignal, string> = {
  reforco: 'A última tentativa de algum treinamento ficou abaixo do critério.',
  atencao:
    'Atingiu o critério, mas a média das últimas tentativas está abaixo de 80.',
  bom: 'Atingiu o critério com média 80 ou mais.',
  sem_tentativa: 'Ainda não fez nenhum treinamento VR.',
};
export const signalPill: Record<LearnerSignal, string> = {
  reforco: 'status-pill border-rose-300/20 bg-rose-400/10 text-rose-100',
  atencao: 'status-pill border-amber-300/25 bg-amber-400/10 text-amber-100',
  bom: 'status-pill status-pill-success',
  sem_tentativa: 'status-pill status-pill-muted',
};
export const levelLabels: Record<CompetencyLevel, string> = {
  reforcar: 'Reforçar',
  em_desenvolvimento: 'Em desenvolvimento',
  dominada: 'Dominada',
};
export const levelPill: Record<CompetencyLevel, string> = {
  reforcar: 'status-pill border-rose-300/20 bg-rose-400/10 text-rose-100',
  em_desenvolvimento:
    'status-pill border-amber-300/25 bg-amber-400/10 text-amber-100',
  dominada: 'status-pill status-pill-success',
};
export const bandLabels = {
  otimo: 'Ótimo',
  bom: 'Bom',
  atencao: 'Atenção',
  critico: 'Abaixo de 70',
} as const;

export const competencyName = (id: string | null | undefined) =>
  id ? (competencyLabels[id] ?? stepLabels[id] ?? id.replace(/_/g, ' ')) : '—';

export const pct = (value: number | null | undefined) =>
  value == null ? '—' : `${Math.round(value)}%`;
export const ratePct = (value: number | null | undefined) =>
  value == null ? '—' : `${Math.round(value * 100)}%`;

/** Ganho em pontos: "+12" / "−4" / "—". */
export function formatGain(value: number | null | undefined) {
  if (value == null) return '—';
  const n = Math.round(value);
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0';
}

const shortDay = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
});
const shortMonth = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  year: '2-digit',
});

/** Rótulo de um ponto da série (data ISO sem hora, no fuso local). */
export function bucketLabel(date: string, bucket: 'day' | 'week' | 'month') {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  const when = new Date(y, m - 1, d);
  return bucket === 'month'
    ? shortMonth.format(when).replace('. de ', '/')
    : shortDay.format(when);
}

export const formatMinutes = (minutes: number | null | undefined) =>
  minutes == null
    ? '—'
    : minutes >= 60
      ? `${Math.floor(minutes / 60)} h ${minutes % 60} min`
      : `${minutes} min`;

/** Link para Iniciar já com turma, treinamento e aluno escolhidos (o que vier). */
export function startLink(choice: {
  classId?: string | null;
  lessonId?: string | null;
  enrollmentId?: string | null;
  practice?: boolean;
}) {
  const params = new URLSearchParams();
  if (choice.practice) params.set('modo', 'teste');
  if (choice.classId) params.set('turma', choice.classId);
  if (choice.lessonId) params.set('licao', choice.lessonId);
  if (choice.enrollmentId) params.set('matricula', choice.enrollmentId);
  const query = params.toString();
  return `/app/iniciar${query ? `?${query}` : ''}`;
}

/** Foto de capa do curso (enviada pela Immersia no catálogo), como URL para <img>; null = sem capa. */
export function courseCover(
  coverUrl: string | null | undefined
): string | null {
  return coverUrl ? `${API_URL}${coverUrl}` : null;
}

/** Próxima etapa do curso: a primeira não concluída ou um VR ainda abaixo do critério. */
export function nextLesson(path: LearningPath) {
  return (
    path.lessons.find(
      (l) =>
        !l.completed_at ||
        (l.type === 'vr_training' && l.vr_outcome !== 'passed')
    ) ?? null
  );
}

// ---------------------------------------------------------------- turmas e treinamentos
export const riskLabels: Record<ClassRisk, string> = {
  bom: 'Saudável',
  atencao: 'Atenção',
  critico: 'Crítico',
  sem_dados: 'Sem dados',
};
export const riskHelp: Record<ClassRisk, string> = {
  bom: 'Participação de 60% ou mais, média 80 ou mais e ninguém em reforço.',
  atencao:
    'Participação abaixo de 60%, média abaixo de 80 ou alguém em reforço.',
  critico: 'Um quarto ou mais dos alunos em reforço, ou média abaixo de 70.',
  sem_dados: 'Ninguém treinou no VR no período.',
};
export const riskPill: Record<ClassRisk, string> = {
  bom: 'status-pill status-pill-success',
  atencao: 'status-pill border-amber-300/25 bg-amber-400/10 text-amber-100',
  critico: 'status-pill border-rose-300/20 bg-rose-400/10 text-rose-100',
  sem_dados: 'status-pill status-pill-muted',
};

/** Cores da situação de conformidade nos gráficos (sempre acompanhadas do rótulo). */
export const complianceColor: Record<ComplianceStatus, string> = {
  apto: '#34d399',
  a_vencer: '#fbbf24',
  vencido: '#fb7185',
  revisar: '#f59e0b',
  em_andamento: '#22d3ee',
  pendente: 'rgba(255,255,255,0.22)',
};
export const complianceOrder: ComplianceStatus[] = [
  'apto',
  'a_vencer',
  'em_andamento',
  'revisar',
  'vencido',
  'pendente',
];

export const trainingPlaces: Record<string, string> = {
  'fire-class-a': 'Escritório Immersia',
};

export function formatRelative(value: string | null | undefined) {
  if (!value) return 'nunca';
  const days = Math.floor(
    (Date.now() - new Date(value).getTime()) / 86_400_000
  );
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'há 1 mês' : `há ${months} meses`;
}

/** Tira do título o tipo que a frase já diz: "Quiz: brigada" → "brigada" (para "Responder o quiz “brigada”"). */
export function withoutKind(
  title: string | null | undefined,
  kind: 'quiz' | 'vr'
) {
  if (!title) return '';
  const pattern =
    kind === 'quiz'
      ? /^quiz\s*[:\-–—]\s*/i
      : /^(treinamento( vr)?|vr)\s*[:\-–—]\s*/i;
  const clean = title.replace(pattern, '');
  return clean
    ? clean.charAt(0).toLocaleUpperCase('pt-BR') + clean.slice(1)
    : title;
}

/** Data curta com hora (06/11 14:05), para eixos de vários eventos no mesmo dia. */
export function formatShortDateTime(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Mantém a altura de uma área (ex.: tabela filtrada) enquanto a pessoa filtra: a página não encolhe nem pula de
 * posição. A altura volta a ser medida quando `resetKey` muda (outros dados, como outro período ou outra turma).
 * Uso: <div ref={useStableHeight(chave)}>…</div>
 */
export function useStableHeight(resetKey: unknown) {
  const node = useRef<HTMLElement | null>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const tallest = useRef(0);
  useEffect(() => {
    tallest.current = 0;
    if (node.current) node.current.style.minHeight = '';
  }, [resetKey]);
  useEffect(() => () => observer.current?.disconnect(), []);
  return useCallback((el: HTMLElement | null) => {
    observer.current?.disconnect();
    node.current = el;
    if (!el) return;
    observer.current = new ResizeObserver(() => {
      const height = el.offsetHeight;
      if (height > tallest.current) {
        tallest.current = height;
        el.style.minHeight = `${height}px`;
      }
    });
    observer.current.observe(el);
  }, []);
}

/** Marca com `is-stuck` um elemento sticky quando ele gruda no topo (abaixo do cabeçalho de `offset` px). */
export function useStuckClass(offset = 91) {
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), []);
  return useCallback(
    (el: HTMLElement | null) => {
      cleanup.current?.();
      cleanup.current = null;
      if (!el) return;
      const update = () =>
        el.classList.toggle(
          'is-stuck',
          getComputedStyle(el).position === 'sticky' &&
            window.scrollY > 0 &&
            el.getBoundingClientRect().top <= offset + 0.5
        );
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      cleanup.current = () => {
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      };
    },
    [offset]
  );
}

/**
 * Paginação de uma lista já filtrada. Volta à primeira página quando `resetKey` muda (outra busca ou outro filtro).
 * Uso: const paged = usePaged(filtrados, 20, busca); … paged.items … <Pager {...paged} />
 */
export function usePaged<T>(list: T[], size: number, resetKey: unknown) {
  const [state, setState] = useState({ page: 0, key: resetKey });
  const page = Object.is(state.key, resetKey) ? state.page : 0;
  if (!Object.is(state.key, resetKey)) setState({ page: 0, key: resetKey });
  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(page, pages - 1);
  return {
    items: list.slice(current * size, current * size + size),
    page: current,
    pages,
    total: list.length,
    from: list.length ? current * size + 1 : 0,
    to: Math.min(list.length, current * size + size),
    setPage: (next: number) =>
      setState({ page: Math.max(0, Math.min(pages - 1, next)), key: resetKey }),
  };
}

/** Saúde das organizações clientes (painel da Immersia). */
export const healthOrder: ClientHealth[] = [
  'parada',
  'sem_uso',
  'baixa',
  'ativa',
  'inativa',
];
export const healthLabels: Record<ClientHealth, string> = {
  ativa: 'Ativa',
  baixa: 'Pouco uso',
  parada: 'Parada',
  sem_uso: 'Nunca usou',
  inativa: 'Desativada',
};
export const healthHelp: Record<ClientHealth, string> = {
  ativa: 'Treinou no período com 40% ou mais dos alunos.',
  baixa: 'Treinou no período, mas com menos de 40% dos alunos.',
  parada: 'Nenhuma tentativa há mais de 30 dias.',
  sem_uso: 'Nenhuma tentativa de aluno até hoje.',
  inativa: 'Organização desativada pela Immersia.',
};
export const healthPill: Record<ClientHealth, string> = {
  ativa: 'status-pill-success',
  baixa: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
  parada: 'border-rose-300/25 bg-rose-400/10 text-rose-100',
  sem_uso: 'border-violet-300/25 bg-violet-400/10 text-violet-100',
  inativa: 'status-pill-muted',
};
export const healthColor: Record<ClientHealth, string> = {
  ativa: '#34d399',
  baixa: '#fbbf24',
  parada: '#fb7185',
  sem_uso: '#a78bfa',
  inativa: 'rgba(255,255,255,0.25)',
};

/** Variação com sinal: +3, −2, 0. */
export function formatDelta(value: number | null | undefined, unit = '') {
  if (value == null) return null;
  if (value === 0) return `igual ao período anterior`;
  const n = Number.isInteger(value) ? value : value.toLocaleString('pt-BR');
  return `${value > 0 ? '+' : '−'}${String(n).replace('-', '')}${unit} vs. período anterior`;
}
