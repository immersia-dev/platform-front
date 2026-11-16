import { Printer } from 'lucide-react';
import { useParams } from 'react-router-dom';

import logoUrl from '../../assets/Immersia_logo-removebg.png';
import { useAuth } from '../../auth/useAuth';
import { api, type Certificate } from '../api';
import {
  formatCnpj,
  formatDate,
  formatHours,
  useLoad,
  validityText,
  verificationUrl,
} from '../format';
import { ComplianceBadge, ErrorState, Loading, Notice, PageTitle } from '../ui';

/** Certificado para imprimir, com os dados que a NR-1 pede e a verificação pública. */
export default function Certificado() {
  const { enrollmentId = '', classCourseId = '' } = useParams();
  const { user } = useAuth();
  const cert = useLoad(
    () => api<Certificate>(`/certificates/${enrollmentId}/${classCourseId}`),
    [enrollmentId, classCourseId]
  );
  const back =
    user?.role === 'learner' ? '/app/meus-cursos' : '/app/conformidade';

  if (cert.loading) return <Loading />;
  if (cert.error || !cert.data)
    return <ErrorState message={cert.error || 'Certificado indisponível.'} />;
  const c = cert.data;
  const link = verificationUrl(
    c.enrollment_id,
    c.class_course_id,
    c.verification_code
  );
  const label = 'text-[11px] uppercase tracking-[0.14em] text-slate-500';

  return (
    <>
      <div className="no-print">
        <PageTitle
          back={back}
          title="Certificado"
          actions={
            <>
              <ComplianceBadge status={c.status} />
              <button
                type="button"
                className="primary-btn sm:w-auto sm:px-5"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" /> Imprimir ou salvar em PDF
              </button>
            </>
          }
        />
        {c.status === 'vencido' ? (
          <div className="mb-5">
            <Notice tone="error">
              A validade terminou em {formatDate(c.valid_until)}. É preciso
              fazer a reciclagem.
            </Notice>
          </div>
        ) : null}
      </div>

      <article className="certificate-print mx-auto max-w-4xl rounded-[28px] bg-white p-10 text-slate-900 shadow-2xl sm:p-14">
        <div className="flex items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <img
            src={logoUrl}
            alt="Immersia"
            className="h-14 w-auto brightness-0"
          />
          <p className="text-right text-xs uppercase tracking-[0.25em] text-slate-500">
            Certificado de capacitação
          </p>
        </div>

        <p className="mt-10 text-center text-sm uppercase tracking-[0.2em] text-slate-500">
          Certificamos que
        </p>
        <h1 className="mt-3 text-center text-4xl font-semibold text-slate-900">
          {c.student_name}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-slate-700">
          da organização <strong>{c.company_name}</strong>
          {c.company_cnpj ? ` (CNPJ ${formatCnpj(c.company_cnpj)})` : ''}{' '}
          concluiu o curso <strong>{c.course_title}</strong>
          {c.workload_hours
            ? `, com carga horária de ${formatHours(c.workload_hours)}`
            : ''}
          , incluindo o treinamento prático em realidade virtual dentro do
          critério de aprovação.
        </p>

        <dl className="mt-10 grid gap-6 text-sm sm:grid-cols-3">
          <div>
            <dt className={label}>Concluído em</dt>
            <dd className="mt-1 font-semibold">{formatDate(c.completed_at)}</dd>
          </div>
          <div>
            <dt className={label}>Validade</dt>
            <dd className="mt-1 font-semibold">
              {c.valid_until
                ? `Até ${formatDate(c.valid_until)}`
                : validityText(c)}
            </dd>
          </div>
          <div>
            <dt className={label}>Local</dt>
            <dd className="mt-1 font-semibold">
              {c.company_name} · {c.class_name}
            </dd>
          </div>
        </dl>

        {c.syllabus ? (
          <div className="mt-8 text-sm">
            <p className={label}>Conteúdo programático</p>
            <p className="mt-1 whitespace-pre-line text-slate-700">
              {c.syllabus}
            </p>
          </div>
        ) : null}

        <div className="mt-12 grid gap-10 text-center text-sm sm:grid-cols-2">
          <div className="border-t border-slate-300 pt-3">
            <p className="font-semibold">
              {c.instructor_names.join(', ') || '—'}
            </p>
            <p className="text-xs text-slate-500">
              {c.instructor_names.length > 1 ? 'Instrutores' : 'Instrutor'}
            </p>
          </div>
          <div className="border-t border-slate-300 pt-3">
            <p className="font-semibold">{c.technical_lead || '—'}</p>
            <p className="text-xs text-slate-500">Responsável técnico</p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-slate-100 p-5 text-xs text-slate-600">
          <p>
            Código de verificação:{' '}
            <strong className="font-mono text-sm tracking-widest text-slate-900">
              {c.verification_code}
            </strong>
            {c.cycle > 1 ? ` · reciclagem ${c.cycle - 1}` : ''}
          </p>
          <p className="mt-1 break-all">Confira a autenticidade em {link}</p>
        </div>
      </article>
    </>
  );
}
