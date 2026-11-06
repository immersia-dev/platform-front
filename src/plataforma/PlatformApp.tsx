import type { ReactElement } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { useAuth } from '../auth/useAuth';
import {
  RequireAuth,
  RequireRoles,
  RoleHomeRedirect,
} from '../auth/RouteGuards';
import AppShell from '../components/AppShell';
import type { AppRole } from '../data/mockPlatform';
import DevProfiles from '../pages/DevProfiles';
import Login from '../pages/Login';
import { api, type User } from './api';
import { useLoad } from './format';
import Certificado from './pages/Certificado';
import Conformidade from './pages/Conformidade';
import CursoDetalhe from './pages/CursoDetalhe';
import Cursos from './pages/Cursos';
import Aluno from './pages/Aluno';
import CursoDesempenho from './pages/CursoDesempenho';
import Desempenho from './pages/Desempenho';
import Etapa from './pages/Etapa';
import EtapaPrevia from './pages/EtapaPrevia';
import Iniciar from './pages/Iniciar';
import MeuCurso from './pages/MeuCurso';
import MeusCursos from './pages/MeusCursos';
import Painel from './pages/Painel';
import PainelImmersia from './pages/PainelImmersia';
import Treinamento from './pages/Treinamento';
import Treinamentos from './pages/Treinamentos';
import OrganizacaoDetalhe from './pages/OrganizacaoDetalhe';
import Organizacoes from './pages/Organizacoes';
import Perfil, { PasswordForm } from './pages/Perfil';
import Pessoas from './pages/Pessoas';
import Privacidade from './pages/Privacidade';
import Quests from './pages/Quests';
import Sessao from './pages/Sessao';
import Sessoes from './pages/Sessoes';
import TurmaDetalhe from './pages/TurmaDetalhe';
import Turmas from './pages/Turmas';
import VerificarCertificado from './pages/VerificarCertificado';

const everyone: AppRole[] = [
  'super_admin',
  'org_admin',
  'instructor',
  'learner',
];
/** Painel: a Immersia vê a plataforma inteira; gestor e instrutor, a organização. */
function PainelRoute() {
  const { user } = useAuth();
  return user?.role === 'super_admin' ? <PainelImmersia /> : <Painel />;
}

const only = (roles: AppRole[], page: ReactElement) => (
  <RequireRoles roles={roles}>{page}</RequireRoles>
);

/** Senha definida pelo gestor: a pessoa escolhe a própria antes de usar a plataforma. */
function FirstAccess() {
  const me = useLoad(() => api<User>('/auth/me'), []);
  if (me.data?.must_change_password)
    return (
      <div className="mx-auto mt-6 max-w-md">
        <h1 className="p-title">Crie sua senha</h1>
        <p className="p-sub mb-5">
          A senha que você recebeu é provisória. Escolha uma nova para
          continuar.
        </p>
        <PasswordForm onDone={() => void me.reload(true)} />
        <p className="mt-4 text-center text-xs text-white/40">
          Como tratamos seus dados:{' '}
          <a
            href={`${import.meta.env.BASE_URL}privacidade`}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-200 underline"
          >
            aviso de privacidade
          </a>
        </p>
      </div>
    );
  return <Outlet />;
}

/** Rotas da plataforma ligada ao platform-back (fora do modo demonstração). */
export default function PlatformApp() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dev" element={<DevProfiles />} />
      <Route path="/dev/:roleSlug" element={<DevProfiles />} />
      <Route
        path="/verificar/:enrollmentId/:classCourseId"
        element={<VerificarCertificado />}
      />
      <Route path="/privacidade" element={<Privacidade />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route element={<FirstAccess />}>
          <Route index element={<RoleHomeRedirect />} />
          <Route
            path="painel"
            element={only(
              ['super_admin', 'org_admin', 'instructor'],
              <PainelRoute />
            )}
          />
          <Route
            path="inicio"
            element={<Navigate to="/app/painel" replace />}
          />
          <Route
            path="alunos/:studentId"
            element={only(['org_admin', 'instructor'], <Aluno />)}
          />
          <Route
            path="treinamentos"
            element={only(['super_admin'], <Treinamentos />)}
          />
          <Route
            path="treinamentos/:lessonId"
            element={only(['super_admin'], <Treinamento />)}
          />
          <Route
            path="meus-cursos/:enrollmentId/:classCourseId/etapas/:lessonId"
            element={only(['learner'], <Etapa />)}
          />
          <Route
            path="desempenho/:enrollmentId/:classCourseId"
            element={only(['learner'], <CursoDesempenho />)}
          />
          <Route
            path="alunos/:studentId/cursos/:enrollmentId/:classCourseId"
            element={only(['org_admin', 'instructor'], <CursoDesempenho />)}
          />
          <Route
            path="cursos/:courseId/etapas/:lessonId"
            element={only(['super_admin', 'org_admin'], <EtapaPrevia />)}
          />
          <Route
            path="meus-cursos"
            element={only(['learner'], <MeusCursos />)}
          />
          <Route
            path="meus-cursos/:enrollmentId/:classCourseId"
            element={only(['learner'], <MeuCurso />)}
          />
          <Route
            path="desempenho"
            element={only(['learner'], <Desempenho />)}
          />
          <Route
            path="iniciar"
            element={only(['learner', 'instructor'], <Iniciar />)}
          />
          <Route
            path="sessoes"
            element={only(['instructor', 'org_admin'], <Sessoes />)}
          />
          <Route path="resultados" element={only(['learner'], <Sessoes />)} />
          <Route
            path="sessoes/:requestId"
            element={only(everyone, <Sessao />)}
          />
          <Route
            path="turmas"
            element={only(['org_admin', 'instructor'], <Turmas />)}
          />
          <Route
            path="turmas/:classId"
            element={only(['org_admin', 'instructor'], <TurmaDetalhe />)}
          />
          <Route path="pessoas" element={only(['org_admin'], <Pessoas />)} />
          <Route
            path="conformidade"
            element={only(['org_admin'], <Conformidade />)}
          />
          <Route
            path="quests"
            element={only(['org_admin', 'instructor'], <Quests />)}
          />
          <Route
            path="organizacoes"
            element={only(['super_admin'], <Organizacoes />)}
          />
          <Route
            path="organizacoes/:companyId"
            element={only(['super_admin'], <OrganizacaoDetalhe />)}
          />
          <Route
            path="cursos"
            element={only(['super_admin', 'org_admin'], <Cursos />)}
          />
          <Route
            path="cursos/:courseId"
            element={only(['super_admin', 'org_admin'], <CursoDetalhe />)}
          />
          <Route
            path="certificados/:enrollmentId/:classCourseId"
            element={only(everyone, <Certificado />)}
          />
          <Route path="perfil" element={only(everyone, <Perfil />)} />
          <Route path="*" element={<RoleHomeRedirect />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
