import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  BookOpenText,
  Building2,
  Glasses,
  Headset,
  History,
  Play,
  Repeat,
  Library,
  ChevronDown,
  CircleUserRound,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  TrendingUp,
  UserCog,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import logoUrl from '../assets/Immersia_logo-removebg.png';
import { useAuth } from '../auth/useAuth';
import { usePlatformData } from '../data/PlatformDataContext';
import { roleLabels, type AppRole } from '../data/mockPlatform';
import { useRouteDataSkeleton } from '../hooks/useRouteDataSkeleton';
import { isDemoMode } from '../lib/demoMode';
import { areDevProfilesEnabled, devProfileLinks } from '../lib/devProfiles';
import { roleNames, roleToBack } from '../plataforma/api';
import { initials } from '../plataforma/format';
import LanguageSelect from './LanguageSelect';
import PageDataSkeleton from './PageDataSkeleton';

type NavigationItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: AppRole[];
  description: string;
};

const allRoles: AppRole[] = [
  'super_admin',
  'org_admin',
  'instructor',
  'learner',
];

const navigationItems: NavigationItem[] = [
  {
    to: '/app/overview',
    label: 'Visão geral',
    icon: LayoutDashboard,
    roles: ['super_admin', 'org_admin', 'instructor'],
    description: 'Resumo operacional da plataforma',
  },
  {
    to: '/app/organizations',
    label: 'Organizações',
    icon: Building2,
    roles: ['super_admin'],
    description: 'Organizações e módulos contratados',
  },
  {
    to: '/app/users',
    label: 'Usuários',
    icon: UserCog,
    roles: ['super_admin', 'org_admin'],
    description: 'Controle de acessos e perfis',
  },
  {
    to: '/app/groups',
    label: 'Turmas',
    icon: UsersRound,
    roles: ['org_admin', 'instructor'],
    description: 'Grupos, alunos e módulos',
  },
  {
    to: '/app/students',
    label: 'Alunos',
    icon: GraduationCap,
    roles: ['org_admin', 'instructor'],
    description: 'Turma, tentativas e resultados',
  },
  {
    to: '/app/studies',
    label: 'Estudos',
    icon: BookOpenText,
    roles: allRoles,
    description: 'Trilhas, materiais e treinamentos',
  },
  {
    to: '/app/profile',
    label: 'Perfil',
    icon: CircleUserRound,
    roles: allRoles,
    description: 'Dados da sessão atual',
  },
];

// API da plataforma: telas ligadas ao platform-back (o modo demonstração mantém as telas acima)
const platformNavigation: NavigationItem[] = [
  {
    to: '/app/painel',
    label: 'Painel',
    icon: LayoutDashboard,
    roles: ['super_admin', 'org_admin', 'instructor'],
    description: '',
  },
  {
    to: '/app/meus-cursos',
    label: 'Meus cursos',
    icon: BookOpenText,
    roles: ['learner'],
    description: '',
  },
  {
    to: '/app/iniciar',
    label: 'Iniciar treinamento',
    icon: Play,
    roles: ['learner', 'instructor'],
    description: '',
  },
  {
    to: '/app/desempenho',
    label: 'Meu desempenho',
    icon: TrendingUp,
    roles: ['learner'],
    description: '',
  },
  {
    to: '/app/turmas',
    label: 'Minhas turmas',
    icon: UsersRound,
    roles: ['instructor'],
    description: '',
  },
  {
    to: '/app/turmas',
    label: 'Turmas',
    icon: UsersRound,
    roles: ['org_admin'],
    description: '',
  },
  {
    to: '/app/pessoas',
    label: 'Pessoas',
    icon: UserCog,
    roles: ['org_admin'],
    description: '',
  },
  {
    to: '/app/sessoes',
    label: 'Sessões VR',
    icon: History,
    roles: ['instructor'],
    description: '',
  },
  {
    to: '/app/quests',
    label: 'Quests',
    icon: Headset,
    roles: ['org_admin', 'instructor'],
    description: '',
  },
  {
    to: '/app/organizacoes',
    label: 'Organizações',
    icon: Building2,
    roles: ['super_admin'],
    description: '',
  },
  {
    to: '/app/cursos',
    label: 'Cursos',
    icon: Library,
    roles: ['super_admin', 'org_admin'],
    description: '',
  },
  {
    to: '/app/treinamentos',
    label: 'Treinamentos VR',
    icon: Glasses,
    roles: ['super_admin'],
    description: '',
  },
];

const getInitials = initials;

export default function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const routeDataLoading =
    useRouteDataSkeleton(location.pathname) && isDemoMode;
  const platformData = usePlatformData();

  if (!user) return null;

  const visibleItems = (
    isDemoMode ? navigationItems : platformNavigation
  ).filter((item) => item.roles.includes(user.role));
  const roleName = isDemoMode
    ? roleLabels[user.role]
    : roleNames[roleToBack[user.role]];
  const currentItem =
    visibleItems.find((item) => location.pathname.startsWith(item.to)) ??
    visibleItems[0];

  function handleSignOut() {
    signOut();
    navigate('/');
  }

  return (
    <main className="immersia-bg min-h-screen text-white antialiased">
      <div className="min-h-screen bg-black/15">
        <div className="flex min-h-screen">
          <div
            className={[
              'fixed inset-0 z-40 bg-black/60 transition lg:hidden',
              mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
            ].join(' ')}
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside
            className={[
              'sidebar-panel fixed inset-y-0 left-0 z-50 w-[290px] transition-transform duration-200 lg:translate-x-0',
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
            ].join(' ')}
          >
            <div className="relative flex items-center justify-center">
              <div className="flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="Immersia"
                  className="h-16 w-auto select-none"
                  draggable={false}
                />
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="icon-button absolute right-0 lg:hidden"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isDemoMode ? (
              <div className="admin-card mt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-sm font-semibold text-cyan-100 ring-1 ring-cyan-300/20">
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0 self-center">
                    <p className="truncate text-sm font-semibold text-white">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-white/55">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <nav className={isDemoMode ? 'mt-8 space-y-2' : 'mt-6 space-y-1'}>
              {visibleItems.map((item) => {
                const Icon = item.icon;

                if (!isDemoMode)
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        [
                          'p-nav-item',
                          isActive ? 'p-nav-item-active' : '',
                        ].join(' ')
                      }
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </NavLink>
                  );

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      [
                        'nav-item',
                        isActive ? 'nav-item-active' : 'nav-item-idle',
                      ].join(' ')
                    }
                  >
                    <span className="nav-icon">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 self-center">
                      <span className="block text-sm font-semibold">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs text-white/55">
                        {item.description}
                      </span>
                    </span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-auto">
              {!isDemoMode && user.organizationName ? (
                <p className="mb-3 truncate px-3 text-xs text-white/40">
                  {user.organizationName}
                </p>
              ) : null}
              {!isDemoMode ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-nav-item w-full"
                >
                  <LogOut className="h-[18px] w-[18px]" /> Sair
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="nav-item nav-item-idle w-full"
                >
                  <span className="nav-icon">
                    <LogOut className="h-5 w-5" />
                  </span>
                  <span className="self-center text-left">
                    <span className="block text-sm font-semibold">
                      Encerrar sessão
                    </span>
                    <span className="block text-xs text-white/55">
                      Voltar para o login
                    </span>
                  </span>
                </button>
              )}
            </div>
          </aside>

          <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col lg:pl-[290px]">
            <header className="topbar">
              <div className="container-page flex min-h-[72px] items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="icon-button lg:hidden"
                    aria-label="Abrir menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <h1
                    className={[
                      'truncate text-lg font-semibold text-white',
                      isDemoMode ? '' : 'lg:hidden',
                    ].join(' ')}
                  >
                    {currentItem?.label ?? 'Workspace'}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  {isDemoMode ? <LanguageSelect /> : null}

                  <DropdownMenu.Root modal={false}>
                    <DropdownMenu.Trigger asChild>
                      <button type="button" className="profile-trigger">
                        <span className="profile-avatar">
                          {getInitials(user.name)}
                        </span>
                        <span className="hidden min-w-0 text-left sm:block">
                          <span className="block truncate text-sm font-semibold text-white">
                            {user.name}
                          </span>
                          <span className="block truncate text-xs text-white/55">
                            {roleName}
                          </span>
                        </span>
                        <ChevronDown className="hidden h-4 w-4 text-white/45 sm:block" />
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        sideOffset={10}
                        align="end"
                        className="dropdown-panel"
                      >
                        <DropdownMenu.Item
                          onSelect={(event) => {
                            event.preventDefault();
                            navigate(
                              isDemoMode ? '/app/profile' : '/app/perfil'
                            );
                          }}
                          className="dropdown-item"
                        >
                          <CircleUserRound className="h-4 w-4" />
                          Meu perfil
                        </DropdownMenu.Item>

                        {areDevProfilesEnabled() ? (
                          <>
                            <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
                            <DropdownMenu.Label className="px-3 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-amber-200/70">
                              Trocar perfil (dev)
                            </DropdownMenu.Label>
                            {devProfileLinks.map((profile) => (
                              <DropdownMenu.Item
                                key={profile.slug}
                                onSelect={(event) => {
                                  event.preventDefault();
                                  navigate(`/dev/${profile.slug}`);
                                }}
                                className="dropdown-item"
                              >
                                <Repeat className="h-4 w-4" />
                                {profile.label}
                              </DropdownMenu.Item>
                            ))}
                            <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
                          </>
                        ) : null}

                        <DropdownMenu.Item
                          onSelect={(event) => {
                            event.preventDefault();
                            handleSignOut();
                          }}
                          className="dropdown-item"
                        >
                          <LogOut className="h-4 w-4" />
                          Sair
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>
            </header>

            <section
              className="container-page flex-1 py-8"
              aria-busy={routeDataLoading || platformData.isLoading}
            >
              {routeDataLoading || platformData.isLoading ? (
                <PageDataSkeleton routePath={location.pathname} />
              ) : platformData.error ? (
                <section className="empty-state">
                  <h2 className="text-xl font-semibold text-white">
                    Não foi possível carregar os dados
                  </h2>
                  <p className="mt-3 max-w-xl text-sm text-white/65">
                    {platformData.error}
                  </p>
                  <button
                    type="button"
                    className="secondary-btn mt-5"
                    onClick={() => void platformData.refresh()}
                  >
                    Tentar novamente
                  </button>
                </section>
              ) : (
                <Outlet />
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
