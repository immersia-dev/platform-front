import { BadgeCheck, ShieldX } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';

import logoUrl from '../../assets/Immersia_logo-removebg.png';
import { api, type CertificateCheck } from '../api';
import { complianceLabels, formatDate, useLoad } from '../format';

/** Página pública: quem recebe um certificado impresso confere se ele é verdadeiro. */
export default function VerificarCertificado() {
  const { enrollmentId = '', classCourseId = '' } = useParams();
  const [params] = useSearchParams();
  const code = params.get('codigo') ?? '';
  const check = useLoad(
    () =>
      api<CertificateCheck>(
        `/certificates/${enrollmentId}/${classCourseId}/verify?code=${encodeURIComponent(code)}`,
        { token: null }
      ),
    [enrollmentId, classCourseId, code]
  );

  return (
    <main className="immersia-bg flex min-h-screen items-center justify-center p-6 text-white">
      <section className="glass-card max-w-[520px] text-center">
        <img src={logoUrl} alt="Immersia" className="mx-auto h-14 w-auto" />
        {check.loading ? (
          <p className="mt-8 text-white/60">Conferindo o certificado…</p>
        ) : check.data ? (
          <>
            <BadgeCheck className="mx-auto mt-8 h-12 w-12 text-emerald-300" />
            <h1 className="mt-4 text-2xl font-semibold">
              Certificado autêntico
            </h1>
            <dl className="mt-6 space-y-3 text-left text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-white/55">Aluno</dt>
                <dd className="font-semibold">{check.data.student_name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/55">Organização</dt>
                <dd className="font-semibold">{check.data.company_name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/55">Curso</dt>
                <dd className="text-right font-semibold">
                  {check.data.course_title}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/55">Concluído em</dt>
                <dd className="font-semibold">
                  {formatDate(check.data.completed_at)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/55">Válido até</dt>
                <dd className="font-semibold">
                  {check.data.valid_until
                    ? formatDate(check.data.valid_until)
                    : 'Sem vencimento'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/55">Situação hoje</dt>
                <dd className="font-semibold">
                  {check.data.status === 'renovado'
                    ? 'Substituído por uma reciclagem'
                    : complianceLabels[check.data.status]}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <ShieldX className="mx-auto mt-8 h-12 w-12 text-rose-300" />
            <h1 className="mt-4 text-2xl font-semibold">
              Certificado não encontrado
            </h1>
            <p className="mt-3 text-sm text-white/60">
              Confira se o endereço e o código de verificação foram copiados
              exatamente como estão no certificado.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
