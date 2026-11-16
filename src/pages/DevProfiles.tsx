import {
  ArrowRight,
  Building2,
  GraduationCap,
  ShieldCheck,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';

import logoUrl from '../assets/Immersia_logo-removebg.png';
import { getDefaultAppPath } from '../auth/getDefaultAppPath';
import { useAuth } from '../auth/useAuth';
import {
  roleLabels,
  usersSeed,
  type AppRole,
  type UserRecord,
} from '../data/mockPlatform';
import { areDevProfilesEnabled } from '../lib/devProfiles';
import { DEMO_PASSWORD as DEMO_MODE_PASSWORD, isDemoMode } from '../lib/demoMode';

// contra a API real, os perfis de desenvolvimento usam as contas do seed demo do platform-back
const API_DEMO_PASSWORD = 'Demo-Immersia-2026!';
const apiDemoEmails: Record<AppRole, string> = {
  super_admin: 'admin@example.com',
  org_admin: 'company.admin@example.com',
  instructor: 'instructor@example.com',
  learner: 'student@example.com',
};
const DEMO_PASSWORD = isDemoMode ? DEMO_MODE_PASSWORD : API_DEMO_PASSWORD;

type DebugProfile = {
  slug: string;
  role: AppRole;
  title: string;
  description: string;
  icon: LucideIcon;
};

const debugProfiles: DebugProfile[] = [
  {
    slug: 'super-admin',
    role: 'super_admin',
    title: 'Super Admin',
    description: 'Catálogo, empresas e resultados de toda a plataforma.',
    icon: ShieldCheck,
  },
  {
    slug: 'org-admin',
    role: 'org_admin',
    title: 'Gestor da empresa',
    description: 'Usuários, turmas e conformidade da empresa.',
    icon: Building2,
  },
  {
    slug: 'instructor',
    role: 'instructor',
    title: 'Instrutor',
    description: 'Suas turmas, sessões VR e resultados dos alunos.',
    icon: UserCog,
  },
  {
    slug: 'learner',
    role: 'learner',
    title: 'Aluno',
    description: 'Cursos, etapas, progresso e certificados.',
    icon: GraduationCap,
  },
];

function getDebugUser(role: AppRole): UserRecord | null {
  if (!isDemoMode) return { name: roleLabels[role], email: apiDemoEmails[role], role, status: 'active' } as UserRecord;
  return usersSeed.find((user) => user.role === role && user.status === 'active') ?? null;
}

export default function DevProfiles() {
  const { roleSlug } = useParams();
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const devProfilesEnabled = areDevProfilesEnabled();

  const selectedProfile = useMemo(
    () => debugProfiles.find((profile) => profile.slug === roleSlug) ?? null,
    [roleSlug]
  );

  const selectedUser = selectedProfile ? getDebugUser(selectedProfile.role) : null;

  useEffect(() => {
    if (!devProfilesEnabled || !selectedProfile || !selectedUser) return;
    const debugUser = selectedUser;

    if (user?.email === debugUser.email) {
      navigate(getDefaultAppPath(user.role), { replace: true });
      return;
    }

    async function openDebugProfile() {
      const sessionUser = await signIn({ login: debugUser.email, password: DEMO_PASSWORD }).catch(
        () => null
      );

      if (sessionUser) {
        navigate(getDefaultAppPath(sessionUser.role), { replace: true });
      }
    }

    void openDebugProfile();
  }, [devProfilesEnabled, navigate, selectedProfile, selectedUser, signIn, user?.email, user?.role]);

  if (!devProfilesEnabled) {
    return <Navigate to="/" replace />;
  }

  if (roleSlug && !selectedProfile) {
    return <Navigate to="/dev" replace />;
  }

  if (selectedProfile) {
    return (
      <main className="immersia-bg min-h-screen text-white antialiased">
        <div className="flex min-h-screen items-center justify-center bg-black/10 px-6 py-12">
          <section className="glass-card max-w-[520px] text-center">
            <img
              src={logoUrl}
              alt="Immersia"
              className="mx-auto h-16 w-auto select-none"
              draggable={false}
            />
            <p className="section-kicker mt-8">Modo desenvolvimento</p>
            <h1 className="section-title mt-3">Abrindo {selectedProfile.title}</h1>
            <p className="subtle-text mt-4">
              {selectedUser
                ? `${selectedUser.name} - ${selectedUser.email}`
                : 'Nenhum usuario ativo encontrado para este perfil.'}
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="immersia-bg min-h-screen text-white antialiased">
      <div className="min-h-screen bg-black/10">
        <div className="container-page py-10">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <img
                src={logoUrl}
                alt="Immersia"
                className="mb-6 h-14 w-auto select-none"
                draggable={false}
              />
              <p className="section-kicker">Modo desenvolvimento</p>
              <h1 className="section-title mt-3">Perfis de debug</h1>
              <p className="subtle-text mt-3 max-w-2xl">
                Entre direto com uma persona mockada para revisar permissoes, telas e estados.
              </p>
            </div>

            <Link to="/" className="ghost-btn self-start sm:self-end">
              Voltar ao login
            </Link>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {debugProfiles.map((profile) => {
              const Icon = profile.icon;
              const user = getDebugUser(profile.role);

              return (
                <Link
                  key={profile.role}
                  to={`/dev/${profile.slug}`}
                  className="admin-card group flex min-h-[260px] flex-col justify-between transition hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-white/[0.08]"
                >
                  <div>
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-100 ring-1 ring-cyan-300/20">
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
                      {roleLabels[profile.role]}
                    </p>
                    <h2 className="mt-3 text-xl font-semibold text-white">{profile.title}</h2>
                    <p className="subtle-text mt-3">{profile.description}</p>
                  </div>

                  <div className="mt-8">
                    {user ? (
                      <p className="truncate text-sm text-white/55">{user.email}</p>
                    ) : (
                      <p className="text-sm text-rose-200">Sem usuario ativo</p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
                      Entrar como perfil
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </section>
        </div>
      </div>
    </main>
  );
}
