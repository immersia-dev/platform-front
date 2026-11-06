import { Glasses } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { api, type LearnerAnalytics } from '../api';
import {
  signalHelp,
  signalLabels,
  signalPill,
  startLink,
  useLoad,
} from '../format';
import LearnerReport from '../LearnerReport';
import { Avatar, ErrorState, Loading, PageTitle } from '../ui';

/** Acompanhamento de um aluno (gestor e instrutores das turmas dele). */
export default function Aluno() {
  const { studentId = '' } = useParams();
  const { user } = useAuth();
  const data = useLoad(
    () => api<LearnerAnalytics>(`/analytics/learners/${studentId}`),
    [studentId]
  );
  if (data.loading) return <Loading />;
  if (data.error || !data.data)
    return (
      <ErrorState message={data.error} onRetry={() => void data.reload()} />
    );
  const d = data.data;
  const first = d.classes[0];
  return (
    <>
      <PageTitle
        back="/app/painel"
        title={
          <span className="flex items-center gap-3">
            <Avatar name={d.student.name} />
            {d.student.name}
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {d.classes.map((c) => c.class_name).join(' · ') ||
              'Sem turma ativa'}
            <span className={signalPill[d.signal]} title={signalHelp[d.signal]}>
              {signalLabels[d.signal]}
            </span>
          </span>
        }
        actions={
          user?.role === 'instructor' && first ? (
            <Link
              to={startLink({
                classId: first.class_id,
                enrollmentId: first.enrollment_id,
              })}
              className="primary-btn sm:w-auto sm:px-5"
            >
              <Glasses className="h-4 w-4" /> Iniciar treinamento
            </Link>
          ) : null
        }
      />
      <LearnerReport data={d} canStart={user?.role === 'instructor'} />
    </>
  );
}
