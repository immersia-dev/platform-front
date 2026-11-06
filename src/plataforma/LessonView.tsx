import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  RotateCcw,
  Send,
  XCircle,
} from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import type { LessonContent, QuizAttemptRow, QuizResult } from './api';
import { errorText } from './api';
import { formatDateTime, formatScore } from './format';
import {
  apiHref,
  formatBytes,
  formatMinutesShort,
  kindMeta,
  lessonKind,
  videoSource,
} from './lessons';
import Rich from './Rich';
import { Notice } from './ui';

// O que a pessoa estuda numa etapa: texto, apostila, vídeo, imagem, link ou quiz.

function Note({ text }: { text: string | null }) {
  if (!text?.trim()) return null;
  return (
    <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
      {text}
    </p>
  );
}

export function LessonBody({ content }: { content: LessonContent }) {
  const kind = lessonKind(content);
  if (kind === 'text') return <Rich text={content.body ?? ''} />;

  if (kind === 'pdf') {
    const href = content.file_url
      ? apiHref(content.file_url)
      : content.material_key;
    if (!href)
      return (
        <Notice tone="warn">
          A apostila desta etapa ainda não foi enviada.
        </Notice>
      );
    const download = content.file_url ? `${href}&download=true` : href;
    return (
      <div className="space-y-4">
        <Note text={content.body} />
        <div className="flex flex-wrap items-center gap-2">
          <a
            className="primary-btn sm:w-auto sm:px-4"
            href={href}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-4 w-4" /> Abrir em nova aba
          </a>
          <a
            className="secondary-btn"
            href={download}
            target="_blank"
            rel="noreferrer"
          >
            <Download className="h-4 w-4" /> Baixar
          </a>
          {content.file_name ? (
            <span className="text-xs text-white/45">
              {content.file_name}
              {content.file_size ? ` · ${formatBytes(content.file_size)}` : ''}
            </span>
          ) : null}
        </div>
        {content.file_url ? (
          <iframe
            title={content.title}
            src={href}
            className="hidden h-[72vh] w-full rounded-2xl border border-white/10 bg-white sm:block"
          />
        ) : null}
      </div>
    );
  }

  if (kind === 'video' && content.material_key) {
    const video = videoSource(content.material_key);
    return (
      <div className="space-y-4">
        {video.kind === 'youtube' || video.kind === 'vimeo' ? (
          <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
            <iframe
              title={content.title}
              src={video.src}
              className="h-full w-full"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        ) : video.kind === 'file' ? (
          <video
            src={video.src}
            controls
            preload="metadata"
            className="w-full rounded-2xl border border-white/10 bg-black"
          />
        ) : (
          <a
            className="primary-btn sm:w-auto sm:px-4"
            href={video.src}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-4 w-4" /> Assistir o vídeo
          </a>
        )}
        <Note text={content.body} />
      </div>
    );
  }

  if (kind === 'image' && content.material_key)
    return (
      <div className="space-y-4">
        <img
          src={content.material_key}
          alt={content.title}
          className="w-full rounded-2xl border border-white/10"
        />
        <Note text={content.body} />
      </div>
    );

  let host = '';
  try {
    host = content.material_key
      ? new URL(content.material_key).hostname.replace(/^www\./, '')
      : '';
  } catch {
    host = '';
  }
  return (
    <div className="space-y-4">
      <Note text={content.body} />
      {content.material_key ? (
        <a
          href={content.material_key}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-300/40"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-100">
            <ExternalLink className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-white group-hover:text-cyan-100">
              Abrir o material
            </span>
            <span className="block truncate text-xs text-white/45">
              {host || content.material_key}
            </span>
          </span>
          <span className="hidden text-xs text-white/40 sm:block">
            abre em nova aba
          </span>
        </a>
      ) : (
        <p className="text-sm text-white/50">
          Esta etapa não tem material anexado.
        </p>
      )}
    </div>
  );
}

/** Responder o quiz: a correção vem do servidor, com a explicação de cada pergunta. */
export function QuizRunner({
  content,
  onSubmit,
  history = [],
  preview = false,
  passedWith = null,
}: {
  content: LessonContent;
  /** recebe as respostas e os segundos na página do quiz */
  onSubmit: (
    answers: Record<string, string[]>,
    seconds: number
  ) => Promise<QuizResult>;
  history?: QuizAttemptRow[];
  preview?: boolean;
  /** melhor nota de quem já concluiu o quiz (refazer não desfaz a conclusão) */
  passedWith?: string | number | null;
}) {
  const startedAt = useRef(Date.now());
  const questions = useMemo(
    () => content.quiz?.questions ?? [],
    [content.quiz]
  );
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const answered = questions.filter((q) => answers[q.id]?.length).length;
  const passing = formatScore(content.passing_score);
  const byId = new Map(result?.questions.map((q) => [q.id, q]));

  function toggle(questionId: string, optionId: string, multiple: boolean) {
    if (result) return;
    setAnswers((current) => {
      const chosen = current[questionId] ?? [];
      const next = multiple
        ? chosen.includes(optionId)
          ? chosen.filter((o) => o !== optionId)
          : [...chosen, optionId]
        : [optionId];
      return { ...current, [questionId]: next };
    });
  }

  async function send() {
    setBusy(true);
    setError('');
    try {
      setResult(
        await onSubmit(
          answers,
          Math.round((Date.now() - startedAt.current) / 1000)
        )
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {result ? (
        <div
          className={`flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${result.passed ? 'border-emerald-300/25 bg-emerald-400/[0.08]' : 'border-amber-300/25 bg-amber-400/[0.08]'}`}
          role="status"
        >
          <div
            className={`text-4xl font-semibold tabular-nums ${result.passed ? 'text-emerald-100' : 'text-amber-100'}`}
          >
            {formatScore(result.score)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white">
              {result.passed
                ? preview
                  ? 'Atingiu a nota mínima'
                  : passedWith != null
                    ? 'Aprovado de novo'
                    : 'Aprovado: etapa concluída'
                : passedWith != null
                  ? 'Abaixo da nota mínima nesta tentativa'
                  : 'Abaixo da nota mínima'}
            </p>
            <p className="text-sm text-white/60">
              {result.correct} de {result.total} certas · mínimo {passing}
              {preview
                ? ' · pré-visualização, nada foi registrado'
                : result.number
                  ? ` · tentativa ${result.number}`
                  : ''}
            </p>
            {!result.passed && passedWith != null && !preview ? (
              <p className="mt-1 text-sm text-emerald-100/90">
                A etapa continua concluída: vale a sua melhor nota,{' '}
                {formatScore(passedWith)}.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              setResult(null);
              setAnswers({});
              startedAt.current = Date.now();
            }}
          >
            <RotateCcw className="h-4 w-4" />{' '}
            {result.passed ? 'Refazer' : 'Tentar de novo'}
          </button>
        </div>
      ) : passedWith != null && !preview ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-50/90">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <span>
            Você já foi aprovado neste quiz, com {formatScore(passedWith)}. Pode
            refazer para praticar: a etapa continua concluída e vale a melhor
            nota.
          </span>
        </div>
      ) : (
        <p className="text-sm text-white/55">
          {questions.length} pergunta{questions.length === 1 ? '' : 's'} · nota
          mínima {passing}
          {history.length
            ? ` · melhor nota até aqui ${formatScore(Math.max(...history.map((h) => Number(h.score))))}`
            : ''}
        </p>
      )}

      <ol className="space-y-4">
        {questions.map((q, n) => {
          const checked = byId.get(q.id);
          return (
            <li
              key={q.id}
              className={`rounded-2xl border p-4 sm:p-5 ${checked ? (checked.right ? 'border-emerald-300/25' : 'border-rose-300/25') : 'border-white/10'} bg-white/[0.03]`}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.06] text-xs font-semibold text-white/70">
                  {n + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{q.text}</p>
                  {q.multiple ? (
                    <p className="mt-0.5 text-xs text-cyan-100/70">
                      Marque todas as certas
                    </p>
                  ) : null}
                  <ul className="mt-3 space-y-2">
                    {q.options.map((o) => {
                      const mine = (
                        checked ? checked.chosen : (answers[q.id] ?? [])
                      ).includes(o.id);
                      const right = checked?.correct.includes(o.id);
                      const tone = checked
                        ? right
                          ? 'border-emerald-300/40 bg-emerald-400/10'
                          : mine
                            ? 'border-rose-300/40 bg-rose-400/10'
                            : 'border-white/10'
                        : mine
                          ? 'border-cyan-300/50 bg-cyan-400/10'
                          : 'border-white/10 hover:border-white/25';
                      return (
                        <li key={o.id}>
                          <button
                            type="button"
                            role={q.multiple ? 'checkbox' : 'radio'}
                            aria-checked={mine}
                            disabled={Boolean(result)}
                            onClick={() =>
                              toggle(q.id, o.id, Boolean(q.multiple))
                            }
                            className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm text-white/85 transition disabled:cursor-default ${tone}`}
                          >
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center border ${q.multiple ? 'rounded-md' : 'rounded-full'} ${mine ? 'border-cyan-200 bg-cyan-300 text-[#0b0918]' : 'border-white/30'}`}
                            >
                              {mine ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : null}
                            </span>
                            <span className="min-w-0 flex-1">{o.text}</span>
                            {checked && right ? (
                              <span className="text-xs text-emerald-200">
                                certa
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {checked ? (
                    <p
                      className={`mt-3 flex items-start gap-2 text-sm ${checked.right ? 'text-emerald-100/90' : 'text-rose-100/90'}`}
                    >
                      {checked.right ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      <span>
                        {checked.right ? 'Certa.' : 'Errada.'}{' '}
                        {checked.explanation ?? ''}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {!result ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/50">
            {answered} de {questions.length} respondidas
          </p>
          <button
            type="button"
            className="primary-btn sm:w-auto sm:px-6"
            disabled={busy || answered < questions.length}
            onClick={() => void send()}
          >
            <Send className="h-4 w-4" />{' '}
            {busy ? 'Corrigindo…' : 'Enviar respostas'}
          </button>
        </div>
      ) : null}

      {history.length && !preview ? (
        <div>
          <p className="mb-2 text-xs font-medium text-white/45">
            Suas tentativas
          </p>
          <ul className="flex flex-wrap gap-2">
            {history.map((h) => (
              <li
                key={h.number}
                className={`rounded-lg border px-2.5 py-1 text-xs tabular-nums ${h.passed ? 'border-emerald-300/25 text-emerald-100' : 'border-white/10 text-white/60'}`}
                title={formatDateTime(h.created_at)}
              >
                {h.number}ª · {formatScore(h.score)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export type OutlineItem = {
  id: string;
  title: string;
  kind: ReturnType<typeof lessonKind>;
  done: boolean;
  minutes?: number | null;
  href: string;
};

/** Sumário do curso ao lado da etapa: onde estou, o que já fiz. */
export function LessonOutline({
  items,
  current,
  footer,
}: {
  items: OutlineItem[];
  current: string;
  footer?: ReactNode;
}) {
  return (
    <nav aria-label="Etapas do curso" className="p-card p-4 sm:p-4">
      <p className="mb-2 px-2 text-xs font-medium text-white/45">Etapas</p>
      <ol className="space-y-1">
        {items.map((item, n) => {
          const Icon = kindMeta[item.kind].icon;
          const active = item.id === current;
          return (
            <li key={item.id}>
              <Link
                to={item.href}
                aria-current={active ? 'step' : undefined}
                className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition ${active ? 'bg-cyan-400/10 text-white' : 'text-white/70 hover:bg-white/[0.05] hover:text-white'}`}
              >
                {item.done ? (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-emerald-300"
                    aria-label="Concluída"
                  />
                ) : active ? (
                  <Icon className="h-4 w-4 shrink-0 text-cyan-200" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-white/30" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">
                    {n + 1}. {item.title}
                  </span>
                  <span className="block text-[11px] text-white/40">
                    {kindMeta[item.kind].label}
                    {formatMinutesShort(item.minutes)
                      ? ` · ${formatMinutesShort(item.minutes)}`
                      : ''}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      {footer}
    </nav>
  );
}

type NavTarget = { title: string; href: string } | null;

/** Rodapé da etapa: anterior, a ação desta etapa (concluir) e a próxima, com o nome de cada uma. */
export function LessonNav({
  prev,
  next,
  done,
  children,
  finishHref,
}: {
  prev: NavTarget;
  next: NavTarget;
  done: boolean;
  children?: ReactNode;
  finishHref: string;
}) {
  const side =
    'group flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 transition';
  return (
    <nav
      aria-label="Navegar entre as etapas"
      className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center"
    >
      <div className="order-2 sm:order-1">
        {prev ? (
          <Link
            to={prev.href}
            className={`${side} border-white/10 bg-white/[0.03] hover:border-white/25`}
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-white/50 transition group-hover:-translate-x-0.5" />
            <span className="min-w-0">
              <span className="block text-[11px] uppercase tracking-wide text-white/40">
                Anterior
              </span>
              <span className="block truncate text-sm text-white/85">
                {prev.title}
              </span>
            </span>
          </Link>
        ) : null}
      </div>
      <div className="order-1 flex justify-center sm:order-2">{children}</div>
      <div className="order-3">
        <Link
          to={next ? next.href : finishHref}
          className={`${side} justify-end text-right ${done ? 'border-cyan-300/40 bg-cyan-400/10 hover:border-cyan-300/70' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}
        >
          <span className="min-w-0">
            <span className="block text-[11px] uppercase tracking-wide text-white/40">
              {next ? 'Próxima' : 'Fim do curso'}
            </span>
            <span className="block truncate text-sm text-white/90">
              {next ? next.title : 'Voltar ao curso'}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-cyan-200 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </nav>
  );
}
