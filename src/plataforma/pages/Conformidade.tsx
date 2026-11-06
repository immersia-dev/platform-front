import { Award, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  api,
  errorText,
  post,
  type ComplianceRow,
  type ComplianceStatus,
} from '../api';
import {
  complianceLabels,
  downloadCsv,
  formatDate,
  useLoad,
  useStableHeight,
  usePaged,
} from '../format';
import {
  Card,
  ComplianceBadge,
  Empty,
  ErrorState,
  Loading,
  Notice,
  PageTitle,
  Progress,
  Pager,
  SearchField,
} from '../ui';

const ORDER: ComplianceStatus[] = [
  'vencido',
  'a_vencer',
  'revisar',
  'em_andamento',
  'pendente',
  'apto',
];
const CERTIFIED: ComplianceStatus[] = ['apto', 'a_vencer', 'vencido'];

export default function Conformidade() {
  const data = useLoad(() => api<ComplianceRow[]>('/compliance'), []);
  const [status, setStatus] = useState<ComplianceStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const counts = useMemo(() => {
    const out: Partial<Record<ComplianceStatus, number>> = {};
    for (const r of data.data ?? []) out[r.status] = (out[r.status] ?? 0) + 1;
    return out;
  }, [data.data]);
  const rows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return (data.data ?? [])
      .filter((r) => status === 'all' || r.status === status)
      .filter(
        (r) =>
          !term ||
          `${r.student_name} ${r.class_name} ${r.course_title}`
            .toLocaleLowerCase('pt-BR')
            .includes(term)
      )
      .sort(
        (a, b) =>
          ORDER.indexOf(a.status) - ORDER.indexOf(b.status) ||
          a.student_name.localeCompare(b.student_name, 'pt-BR')
      );
  }, [data.data, status, search]);

  async function renew(r: ComplianceRow) {
    setError('');
    try {
      await post(`/paths/${r.enrollment_id}/${r.class_course_id}/renew`);
      void data.reload(true);
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  function exportCsv() {
    downloadCsv(
      'conformidade.csv',
      [
        'Aluno',
        'E-mail',
        'Turma',
        'Curso',
        'Situação',
        'Progresso (%)',
        'Concluído em',
        'Válido até',
        'Ciclo',
      ],
      rows.map((r) => [
        r.student_name,
        r.student_email,
        r.class_name,
        r.course_title,
        complianceLabels[r.status],
        r.completion_percent,
        formatDate(r.completed_at),
        formatDate(r.valid_until),
        r.cycle,
      ])
    );
  }

  // a lista não encolhe enquanto filtra ou busca; volta a medir quando os dados mudam
  const stableList = useStableHeight(data.data);
  const paged = usePaged(rows, 25, `${status}|${search}`);
  return (
    <>
      <PageTitle
        title="Conformidade"
        actions={
          <button
            type="button"
            className="secondary-btn"
            disabled={!rows.length}
            onClick={exportCsv}
          >
            <Download className="h-4 w-4" /> Exportar
          </button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-1.5">
          {(['all', ...ORDER] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-full border px-3 py-1 text-xs transition ${status === s ? 'border-cyan-300/30 bg-cyan-400/10 text-white' : 'border-white/10 text-white/55 hover:text-white'}`}
            >
              {s === 'all' ? 'Todos' : complianceLabels[s]}
              <span className="ml-1.5 tabular-nums text-white/40">
                {s === 'all' ? (data.data?.length ?? 0) : (counts[s] ?? 0)}
              </span>
            </button>
          ))}
        </div>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar aluno, turma ou curso"
          className="lg:ml-auto lg:w-80"
        />
      </div>
      {error ? (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}
      {data.loading ? (
        <Loading />
      ) : data.error ? (
        <ErrorState message={data.error} onRetry={() => void data.reload()} />
      ) : (
        <Card flush>
          <div ref={stableList}>
            {!rows.length ? (
              <Empty title="Nada por aqui" />
            ) : (
              <div className="overflow-x-auto">
                <table className="p-table">
                  <thead>
                    <tr>
                      <th>Aluno</th>
                      <th>Curso</th>
                      <th>Progresso</th>
                      <th>Situação</th>
                      <th>Válido até</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {paged.items.map((r) => (
                      <tr key={`${r.enrollment_id}:${r.class_course_id}`}>
                        <td>
                          <Link
                            to={`/app/alunos/${r.student_id}`}
                            className="p-link whitespace-nowrap"
                          >
                            {r.student_name}
                          </Link>
                          <p className="text-xs text-white/40">
                            {r.class_name}
                          </p>
                        </td>
                        <td>{r.course_title}</td>
                        <td>
                          <Progress value={r.completion_percent} />
                        </td>
                        <td>
                          <ComplianceBadge status={r.status} />
                        </td>
                        <td className="whitespace-nowrap text-white/55">
                          {formatDate(r.valid_until)}
                        </td>
                        <td className="whitespace-nowrap text-right">
                          {CERTIFIED.includes(r.status) ? (
                            <>
                              {r.status !== 'apto' ? (
                                <button
                                  type="button"
                                  className="mr-2 p-action"
                                  onClick={() => void renew(r)}
                                >
                                  Abrir reciclagem
                                </button>
                              ) : null}
                              <Link
                                to={`/app/certificados/${r.enrollment_id}/${r.class_course_id}`}
                                className="p-action p-action-accent"
                              >
                                <Award className="h-3.5 w-3.5" /> Certificado
                              </Link>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pager {...paged} noun="registros" />
          </div>
        </Card>
      )}
    </>
  );
}
