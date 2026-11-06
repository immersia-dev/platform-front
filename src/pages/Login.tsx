import { useEffect, useId, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Lock,
  ShieldCheck,
  User,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import logoUrl from '../assets/Immersia_logo-removebg.png';
import { getDefaultAppPath } from '../auth/getDefaultAppPath';
import { useAuth } from '../auth/useAuth';
import LanguageSelect from '../components/LanguageSelect';
import { getApiErrorMessage } from '../lib/apiClient';
import { areDevProfilesEnabled, devProfileLinks } from '../lib/devProfiles';
import { DEMO_PASSWORD, isDemoMode } from '../lib/demoMode';
import { roleLabels, usersSeed, type AppRole } from '../data/mockPlatform';

type DemoRole = {
  role: AppRole;
  icon: LucideIcon;
  description: string;
};

const demoRoles: DemoRole[] = [
  {
    role: 'learner',
    icon: GraduationCap,
    description: 'Trilhas encaminhadas, aulas e progresso individual.',
  },
  {
    role: 'instructor',
    icon: UserCog,
    description: 'Turmas acompanhadas, resultados e sinais de reforço.',
  },
  {
    role: 'org_admin',
    icon: Building2,
    description: 'Usuários, turmas e módulos da organização.',
  },
  {
    role: 'super_admin',
    icon: ShieldCheck,
    description: 'Organizações clientes, contratos e catálogo global.',
  },
];

function findDemoUser(role: AppRole) {
  return usersSeed.find(
    (seedUser) => seedUser.role === role && seedUser.status === 'active'
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();

  const loginId = useId();
  const passId = useId();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRole, setPendingRole] = useState<AppRole | null>(null);

  useEffect(() => {
    if (!user) return;

    navigate(getDefaultAppPath(user.role), { replace: true });
  }, [navigate, user]);

  async function handleDemoSignIn(role: AppRole) {
    const demoUser = findDemoUser(role);

    if (!demoUser || isSubmitting) return;

    setAuthError('');
    setIsSubmitting(true);
    setPendingRole(role);

    try {
      const sessionUser = await signIn({
        login: demoUser.email,
        password: DEMO_PASSWORD,
      });

      if (sessionUser) {
        navigate(getDefaultAppPath(sessionUser.role), { replace: true });
      }
    } catch (error) {
      setAuthError(getApiErrorMessage(error, 'Não foi possível entrar.'));
    } finally {
      setIsSubmitting(false);
      setPendingRole(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setAuthError('');

    if (login.trim().length === 0 || password.trim().length === 0) {
      setAuthError('Preencha usuário/e-mail e senha para continuar.');
      return;
    }

    if (password.trim().length < 6) {
      setAuthError('O e-mail ou a senha estão incorretos.');
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionUser = await signIn({ login, password });
      setIsSubmitting(false);

      if (!sessionUser) {
        setAuthError('O e-mail ou a senha estão incorretos.');
        return;
      }

      navigate(getDefaultAppPath(sessionUser.role), { replace: true });
    } catch (error) {
      setIsSubmitting(false);
      setAuthError(getApiErrorMessage(error, 'Não foi possível entrar.'));
    }
  }

  const errorBanner = authError ? (
    <div className="rounded-3xl border border-rose-300/15 bg-rose-400/10 p-4 text-center text-sm text-rose-100">
      {authError}
    </div>
  ) : null;

  const languagePicker = (
    <div className="border-t border-white/10 pt-6 text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/38">
        Idioma da plataforma
      </p>
      <div className="flex justify-center">
        <LanguageSelect variant="login" />
      </div>
    </div>
  );

  return (
    <main className="immersia-bg min-h-screen text-white antialiased">
      <div className="min-h-screen bg-black/10">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
          <section
            className={
              isDemoMode
                ? 'glass-card max-w-[560px]'
                : 'glass-card max-w-[460px]'
            }
            aria-label="Tela de login"
          >
            <header className="mb-8 text-center">
              <div className="mx-auto mb-6 flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="Immersia"
                  className="h-12 w-auto select-none sm:h-16 md:h-20"
                  draggable={false}
                />
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {isDemoMode ? 'Explore a plataforma' : 'Entrar na plataforma'}
              </h1>
              <p className="subtle-text mt-4">
                {isDemoMode
                  ? 'Escolha um perfil para navegar pelo ambiente de demonstração.'
                  : 'Acesse com seu usuário para continuar.'}
              </p>
            </header>

            {/* Na vitrine nao existem contas reais: o acesso por credenciais fica
                de fora e so os perfis de demonstracao aparecem. */}
            {isDemoMode ? (
              <div className="space-y-5">
                {errorBanner}

                <div className="grid gap-3">
                  {demoRoles.map(({ role, icon: Icon, description }) => {
                    const demoUser = findDemoUser(role);
                    const isPending = pendingRole === role;

                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => void handleDemoSignIn(role)}
                        disabled={isSubmitting || !demoUser}
                        className="group flex w-full items-center gap-4 rounded-[24px] border border-white/12 bg-white/6 px-4 py-4 text-left transition hover:border-cyan-300/30 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
                      >
                        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-100 ring-1 ring-cyan-300/20">
                          <Icon className="h-6 w-6" />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-semibold text-white">
                            {roleLabels[role]}
                          </span>
                          <span className="mt-0.5 block text-xs leading-5 text-white/55">
                            {isPending ? 'Abrindo perfil...' : description}
                          </span>
                        </span>

                        <ArrowRight className="h-5 w-5 shrink-0 text-white/35 transition group-hover:translate-x-1 group-hover:text-cyan-100" />
                      </button>
                    );
                  })}
                </div>

                <p className="text-center text-xs leading-5 text-white/40">
                  Ambiente de demonstração com dados fictícios. As alterações
                  que você fizer valem apenas nesta aba.
                </p>

                {languagePicker}
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {errorBanner}

                <div>
                  <label htmlFor={loginId} className="sr-only">
                    {isDemoMode ? 'E-mail' : 'E-mail ou CPF'}
                  </label>

                  {submitted && login.trim().length === 0 ? (
                    <p className="field-error field-error-center field-error-top">
                      {isDemoMode
                        ? 'Informe seu e-mail.'
                        : 'Informe seu e-mail ou CPF.'}
                    </p>
                  ) : null}

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                      <User className="h-5 w-5 text-white/60" />
                    </div>

                    <input
                      id={loginId}
                      name="login"
                      type={isDemoMode ? 'email' : 'text'}
                      autoComplete="username"
                      value={login}
                      onChange={(event) => setLogin(event.target.value)}
                      placeholder={isDemoMode ? 'E-mail' : 'E-mail ou CPF'}
                      aria-invalid={
                        submitted && login.trim().length === 0
                          ? 'true'
                          : 'false'
                      }
                      className={[
                        'pill-input py-3.5 pl-12 pr-4 text-sm sm:text-base',
                        submitted && login.trim().length === 0
                          ? 'border-rose-300/40 focus:border-rose-300'
                          : '',
                      ].join(' ')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={passId} className="sr-only">
                    Senha
                  </label>

                  {submitted && password.trim().length === 0 ? (
                    <p className="field-error field-error-center field-error-top">
                      Informe sua senha.
                    </p>
                  ) : null}

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                      <Lock className="h-5 w-5 text-white/60" />
                    </div>

                    <input
                      id={passId}
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Senha"
                      aria-invalid={
                        submitted && password.trim().length === 0
                          ? 'true'
                          : 'false'
                      }
                      className={[
                        'pill-input py-3.5 pl-12 pr-4 text-sm sm:text-base',
                        submitted && password.trim().length === 0
                          ? 'border-rose-300/40 focus:border-rose-300'
                          : '',
                      ].join(' ')}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="primary-btn mt-2 py-3.5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Entrando...' : 'Entrar'}
                </button>

                {languagePicker}

                {areDevProfilesEnabled() ? (
                  <div className="border-t border-white/10 pt-4">
                    <p className="mb-2.5 text-center text-xs font-medium uppercase tracking-wide text-amber-200/70">
                      Entrar como (desenvolvimento)
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {devProfileLinks.map((profile) => (
                        <Link
                          key={profile.slug}
                          to={`/dev/${profile.slug}`}
                          className="ghost-btn justify-center px-3 py-2 text-sm"
                        >
                          {profile.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
