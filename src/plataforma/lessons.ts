import {
  BookOpenText,
  FileText,
  Glasses,
  Image,
  Link2,
  ListChecks,
  PlayCircle,
  type LucideIcon,
} from 'lucide-react';

import { API_URL, type Lesson, type QuizQuestion } from './api';

// Tipos de etapa de um curso: o que são, como aparecem e como o vídeo é incorporado.

export type LessonKind =
  'text' | 'pdf' | 'video' | 'image' | 'link' | 'quiz' | 'vr';

export const kindMeta: Record<
  LessonKind,
  { label: string; icon: LucideIcon; open: string; hint: string }
> = {
  text: {
    label: 'Texto',
    icon: BookOpenText,
    open: 'Ler',
    hint: 'Conteúdo escrito na própria plataforma.',
  },
  pdf: {
    label: 'Apostila',
    icon: FileText,
    open: 'Abrir apostila',
    hint: 'PDF enviado ou um link para o arquivo.',
  },
  video: {
    label: 'Vídeo',
    icon: PlayCircle,
    open: 'Assistir',
    hint: 'YouTube, Vimeo ou um arquivo .mp4.',
  },
  image: {
    label: 'Imagem',
    icon: Image,
    open: 'Ver',
    hint: 'Infográfico, cartaz ou mapa.',
  },
  link: {
    label: 'Link',
    icon: Link2,
    open: 'Abrir',
    hint: 'Página externa (norma, site, documento).',
  },
  quiz: {
    label: 'Quiz',
    icon: ListChecks,
    open: 'Responder',
    hint: 'Perguntas corrigidas pela plataforma.',
  },
  vr: {
    label: 'Treinamento VR',
    icon: Glasses,
    open: 'Iniciar',
    hint: 'Prática no Quest, com nota e etapas.',
  },
};

export function lessonKind(
  lesson: Pick<Lesson, 'type' | 'material_kind'>
): LessonKind {
  if (lesson.type === 'vr_training') return 'vr';
  if (lesson.type === 'quiz') return 'quiz';
  return lesson.material_kind ?? 'link';
}

/** Endereço completo de um caminho da API (ex.: link assinado da apostila). */
export const apiHref = (path: string) => `${API_URL}${path}`;

export type VideoSource =
  | { kind: 'youtube' | 'vimeo'; src: string }
  | { kind: 'file'; src: string }
  | { kind: 'link'; src: string };

/** Como tocar um vídeo: YouTube e Vimeo viram player incorporado; .mp4/.webm, <video>; o resto, link. */
export function videoSource(url: string): VideoSource {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
    if (host === 'youtu.be')
      return {
        kind: 'youtube',
        src: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`,
      };
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const id =
        u.searchParams.get('v') ?? u.pathname.split('/').filter(Boolean).pop();
      if (id)
        return {
          kind: 'youtube',
          src: `https://www.youtube-nocookie.com/embed/${id}`,
        };
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id && /^\d+$/.test(id))
        return { kind: 'vimeo', src: `https://player.vimeo.com/video/${id}` };
    }
    if (/\.(mp4|webm|ogg|mov)$/i.test(u.pathname))
      return { kind: 'file', src: url };
  } catch {
    // endereço inválido: cai no link
  }
  return { kind: 'link', src: url };
}

export function formatMinutesShort(minutes: number | null | undefined) {
  if (!minutes) return null;
  return minutes >= 60
    ? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ''}`
    : `${minutes} min`;
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return null;
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
    : `${Math.ceil(bytes / 1024)} KB`;
}

// ---------------------------------------------------------------- editor do quiz
let counter = 0;
const nextId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;

export function newQuestion(): QuizQuestion {
  const a = nextId('o');
  return {
    id: nextId('q'),
    text: '',
    multiple: false,
    options: [
      { id: a, text: '' },
      { id: nextId('o'), text: '' },
    ],
    correct: [a],
    explanation: '',
  };
}

export const newOption = () => ({ id: nextId('o'), text: '' });

/** Problemas do quiz antes de salvar (o servidor valida de novo). */
export function quizProblems(questions: QuizQuestion[]): string[] {
  const out: string[] = [];
  if (!questions.length) out.push('Inclua ao menos uma pergunta.');
  questions.forEach((q, i) => {
    const n = i + 1;
    if (!q.text.trim()) out.push(`Pergunta ${n}: escreva o enunciado.`);
    if (q.options.length < 2)
      out.push(`Pergunta ${n}: precisa de ao menos duas alternativas.`);
    if (q.options.some((o) => !o.text.trim()))
      out.push(`Pergunta ${n}: há alternativa vazia.`);
    if (!q.correct?.length) out.push(`Pergunta ${n}: marque a resposta certa.`);
    if (!q.multiple && (q.correct?.length ?? 0) > 1)
      out.push(`Pergunta ${n}: escolha única aceita só uma resposta certa.`);
  });
  return out;
}
