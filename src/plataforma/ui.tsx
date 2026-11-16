import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import type { ComplianceStatus, Course, VrRequest, VrStatus } from './api';
import {
  compliancePill,
  complianceHelp,
  complianceLabels,
  initials,
  vrStatusLabels,
} from './format';

// Componentes enxutos das telas da plataforma: título curto, cartões, números e tabelas sem excesso de texto.

export function PageTitle({
  title,
  subtitle,
  back,
  backLabel = 'Voltar',
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {back ? (
        <Link to={back} className="p-back">
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="p-title">{title}</h1>
          {subtitle ? <div className="p-sub">{subtitle}</div> : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export function Card({
  title,
  action,
  children,
  flush = false,
  className = '',
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={`p-card ${flush ? 'p-0' : ''} ${className}`}>
      {title || action ? (
        <div
          className={`flex items-center justify-between gap-3 ${flush ? 'px-5 pt-5 sm:px-6' : ''} mb-4`}
        >
          {title ? <h2 className="p-card-title">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({
  label: text,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'warn' | 'bad' | 'ok';
}) {
  const color =
    tone === 'bad'
      ? 'text-rose-200'
      : tone === 'warn'
        ? 'text-amber-200'
        : tone === 'ok'
          ? 'text-emerald-200'
          : 'text-white';
  return (
    <div className="p-stat">
      <p className="text-xs text-white/50">{text}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-white/45">{hint}</p> : null}
    </div>
  );
}

export function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  return (
    <span className={compliancePill[status]} title={complianceHelp[status]}>
      {complianceLabels[status]}
    </span>
  );
}

export function VrStatusBadge({ status }: { status: VrStatus }) {
  const style =
    status === 'running'
      ? 'status-pill border-cyan-300/20 bg-cyan-400/10 text-cyan-100'
      : status === 'pending'
        ? 'status-pill border-amber-300/25 bg-amber-400/10 text-amber-100'
        : status === 'completed'
          ? 'status-pill status-pill-success'
          : 'status-pill status-pill-muted';
  return <span className={style}>{vrStatusLabels[status]}</span>;
}

export function OutcomeBadge({ outcome }: { outcome: VrRequest['outcome'] }) {
  if (outcome === 'passed')
    return <span className="status-pill status-pill-success">Aprovado</span>;
  if (outcome === 'needs_review')
    return (
      <span className="status-pill border-amber-300/25 bg-amber-400/10 text-amber-100">
        Abaixo do critério
      </span>
    );
  return <span className="text-white/40">—</span>;
}

export function PracticeBadge() {
  return (
    <span className="status-pill border-violet-300/25 bg-violet-400/10 text-violet-100">
      Teste
    </span>
  );
}

export function Loading({ text = 'Carregando…' }: { text?: string }) {
  return (
    <div className="p-card animate-pulse text-sm text-white/55" role="status">
      {text}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <section className="p-card text-sm">
      <p className="font-semibold text-white">Não foi possível carregar</p>
      <p className="mt-1 text-white/60">{message}</p>
      {onRetry ? (
        <button type="button" className="secondary-btn mt-4" onClick={onRetry}>
          Tentar novamente
        </button>
      ) : null}
    </section>
  );
}

export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="px-1 py-6 text-center">
      <p className="font-medium text-white/80">{title}</p>
      {children ? (
        <div className="mx-auto mt-1 max-w-md text-sm text-white/50">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'error' | 'success' | 'warn';
  children: ReactNode;
}) {
  const style =
    tone === 'error'
      ? 'border-rose-300/15 bg-rose-400/10 text-rose-100'
      : tone === 'success'
        ? 'border-emerald-300/15 bg-emerald-400/10 text-emerald-100'
        : tone === 'warn'
          ? 'border-amber-300/20 bg-amber-400/10 text-amber-100'
          : 'border-cyan-300/15 bg-cyan-400/10 text-cyan-50';
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${style}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}

export function Field({
  label: text,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{text}</span>
      {children}
      {hint ? (
        <span className="mt-1.5 block text-xs text-white/45">{hint}</span>
      ) : null}
    </label>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-cyan-300/80"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-white/60">{value}%</span>
    </div>
  );
}

/** Alternância simples entre opções (ex.: Aluno | Rodada de teste). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="p-tabs" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={o.value === value ? 'p-tab p-tab-active' : 'p-tab'}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Janela simples com formulário. */
export function Dialog({
  open,
  title,
  children,
  onClose,
  footer,
  wide = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`dialog-panel ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="mt-4 space-y-4">{children}</div>
        {footer ? (
          <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>
        ) : null}
      </section>
    </div>
  );
}

export function CourseState({ course }: { course: Course }) {
  if (course.archived_at)
    return <span className="status-pill status-pill-muted">Arquivado</span>;
  if (course.published_at)
    return <span className="status-pill status-pill-success">Publicado</span>;
  return (
    <span className="status-pill border-amber-300/25 bg-amber-400/10 text-amber-100">
      Rascunho
    </span>
  );
}

/** Indicador do painel: ícone, rótulo curto, número e uma linha de apoio. */
export function Kpi({
  icon: Icon,
  label: text,
  value,
  hint,
  tone,
  help,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'warn' | 'bad' | 'ok';
  help?: string;
}) {
  const color =
    tone === 'bad'
      ? 'text-rose-200'
      : tone === 'warn'
        ? 'text-amber-200'
        : tone === 'ok'
          ? 'text-emerald-200'
          : 'text-white';
  return (
    <div className="p-stat flex flex-col gap-2" title={help}>
      <div className="flex items-center gap-2 text-white/55">
        <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.05]">
          <Icon className="h-3.5 w-3.5 text-cyan-200" />
        </span>
        <span className="text-xs font-medium">{text}</span>
      </div>
      <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
      {hint ? <p className="-mt-1 text-xs text-white/45">{hint}</p> : null}
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-cyan-400/20 to-violet-500/25 text-xs font-semibold text-white">
      {initials(name)}
    </span>
  );
}

/** Campo de busca das tabelas: ícone, placeholder curto e botão de limpar pelo teclado (Esc). */
export function SearchField({
  value,
  onChange,
  placeholder = 'Buscar',
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      <input
        type="search"
        className="admin-input pl-11"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onChange('');
        }}
      />
    </label>
  );
}

/** Rodapé de paginação: "21–40 de 132" e anterior/próxima. Some quando tudo cabe numa página. */
export function Pager({
  page,
  pages,
  total,
  from,
  to,
  setPage,
  noun = 'itens',
}: {
  page: number;
  pages: number;
  total: number;
  from: number;
  to: number;
  setPage: (page: number) => void;
  noun?: string;
}) {
  if (pages <= 1) return null;
  return (
    <nav
      className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3 text-xs text-white/55 sm:px-6"
      aria-label="Paginação"
    >
      <span className="tabular-nums">
        {from}–{to} de {total} {noun}
      </span>
      <span className="flex items-center gap-2">
        <span className="hidden tabular-nums sm:inline">
          Página {page + 1} de {pages}
        </span>
        <button
          type="button"
          className="p-action"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Anterior
        </button>
        <button
          type="button"
          className="p-action"
          disabled={page >= pages - 1}
          onClick={() => setPage(page + 1)}
          aria-label="Próxima página"
        >
          Próxima <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </span>
    </nav>
  );
}
