import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useDeferredValue, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import PageHeader from '../components/PageHeader';
import { useAuth } from '../auth/useAuth';
import { modulesSeed, type ModuleRecord } from '../data/mockPlatform';
import { isModuleComingSoon } from '../lib/studyPlatform';

const TRAININGS_PER_PAGE = 3;

type CatalogModule = ModuleRecord & {
  hasAccess: boolean;
  comingSoon: boolean;
};

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}min`;
}

function getCatalogModules(userOrganizationId: string | null, role: string): CatalogModule[] {
  return modulesSeed.map((module) => ({
    ...module,
    comingSoon: isModuleComingSoon(module.id),
    hasAccess:
      role === 'super_admin' ||
      (!!userOrganizationId && module.organizationIds.includes(userOrganizationId)),
  }));
}

export default function Gallery() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('all');
  const [pageByModule, setPageByModule] = useState<Record<string, number>>({});
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  if (!user) return null;

  const canViewResults =
    user.role === 'super_admin' || user.role === 'org_admin' || user.role === 'instructor';
  const catalogModules = getCatalogModules(user.organizationId, user.role);
  const moduleFilterOptions = [
    { id: 'all', label: 'Todos os módulos' },
    ...catalogModules.map((module) => ({ id: module.id, label: module.name })),
  ];
  const selectedModuleLabel =
    moduleFilterOptions.find((option) => option.id === selectedModuleId)?.label ??
    'Todos os módulos';

  const filteredModules = catalogModules
    .filter((module) => selectedModuleId === 'all' || module.id === selectedModuleId)
    .map((module) => ({
      ...module,
      trainings: module.trainings.filter((training) => {
        if (!deferredSearch) return true;

        const haystack =
          `${module.name} ${module.summary} ${training.title} ${training.description}`.toLowerCase();

        return haystack.includes(deferredSearch);
      }),
    }))
    .filter((module) => module.trainings.length > 0);

  const totalTrainings = catalogModules.reduce((total, module) => total + module.trainings.length, 0);
  const filteredTrainings = filteredModules.reduce(
    (total, module) => total + module.trainings.length,
    0
  );

  function changeModulePage(moduleId: string, nextPage: number) {
    setPageByModule((current) => ({
      ...current,
      [moduleId]: nextPage,
    }));
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Treinamentos" />

      {catalogModules.length === 0 ? (
        <section className="empty-state">
          <h3 className="text-xl font-semibold text-white">Nenhum módulo disponível</h3>
          <p className="mt-3 max-w-xl text-sm text-white/65">
            Assim que novos módulos forem adicionados ao catálogo, eles aparecerão aqui.
          </p>
        </section>
      ) : (
        <>
          <section className="gallery-toolbar-shell">
            <div>
              <h2 className="text-lg font-semibold text-white">Catálogo da plataforma</h2>
              <p className="mt-2 text-sm text-white/60">
                Exibindo {filteredTrainings} de {totalTrainings} treinamentos em {filteredModules.length}{' '}
                módulos.
              </p>
            </div>

            <div className="gallery-toolbar-controls">
              <div className="gallery-search-field">
                <Search className="gallery-search-icon h-4 w-4" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="gallery-filter-input"
                  placeholder="Buscar por módulo ou treinamento"
                />
              </div>

              <DropdownMenu.Root modal={false}>
                <DropdownMenu.Trigger asChild>
                  <button type="button" className="gallery-filter-trigger" aria-label="Filtrar por módulo">
                    <span className="truncate">{selectedModuleLabel}</span>
                    <ChevronDown className="h-4 w-4 text-white/45" />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content sideOffset={10} align="end" className="gallery-filter-menu">
                    {moduleFilterOptions.map((option) => {
                      const isActive = option.id === selectedModuleId;

                      return (
                        <DropdownMenu.Item
                          key={option.id}
                          onSelect={() => {
                            setSelectedModuleId(option.id);
                          }}
                          className={[
                            'gallery-filter-option',
                            isActive ? 'gallery-filter-option-active' : '',
                          ].join(' ')}
                        >
                          <span className="truncate">{option.label}</span>
                          {isActive ? <Check className="h-4 w-4" /> : null}
                        </DropdownMenu.Item>
                      );
                    })}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </section>

          {filteredModules.length === 0 ? (
            <section className="empty-state">
              <h3 className="text-xl font-semibold text-white">Nenhum treinamento encontrado</h3>
              <p className="mt-3 max-w-xl text-sm text-white/65">
                Ajuste a busca ou selecione outro módulo para continuar navegando.
              </p>
            </section>
          ) : (
            <div className="space-y-8">
              {filteredModules.map((module) => {
                const pageCount = Math.max(1, Math.ceil(module.trainings.length / TRAININGS_PER_PAGE));
                const currentPage = Math.min(pageByModule[module.id] ?? 0, pageCount - 1);
                const pageStart = currentPage * TRAININGS_PER_PAGE;
                const pageTrainings = module.trainings.slice(
                  pageStart,
                  pageStart + TRAININGS_PER_PAGE
                );

                return (
                  <section
                    key={module.id}
                    className={[
                      'module-shell',
                      module.hasAccess ? '' : 'module-shell-locked',
                    ].join(' ')}
                  >
                    <div className="module-header">
                      <div>
                        <p className="section-kicker">Módulo</p>
                        <h3 className="text-2xl font-semibold text-white">{module.name}</h3>
                        <p className="mt-2 max-w-2xl text-sm text-white/65">{module.summary}</p>
                        {module.comingSoon ? (
                          <p className="module-locked-text mt-3">
                            Em breve: treinamento em desenvolvimento.
                          </p>
                        ) : !module.hasAccess ? (
                          <p className="module-locked-text mt-3">
                            Este módulo ainda não está liberado para a sua organização.
                          </p>
                        ) : null}
                      </div>

                      {pageCount > 1 ? (
                        <div className="module-pager">
                          <button
                            type="button"
                            className="module-pager-button"
                            disabled={currentPage === 0}
                            onClick={() => changeModulePage(module.id, currentPage - 1)}
                            aria-label={`Página anterior de ${module.name}`}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>

                          <span className="module-pager-status">
                            Página {currentPage + 1} de {pageCount}
                          </span>

                          <button
                            type="button"
                            className="module-pager-button"
                            disabled={currentPage >= pageCount - 1}
                            onClick={() => changeModulePage(module.id, currentPage + 1)}
                            aria-label={`Próxima página de ${module.name}`}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="module-meta">
                          {module.trainings.length} treinamento
                          {module.trainings.length > 1 ? 's' : ''} neste módulo
                        </p>
                      )}
                    </div>

                    <div className="module-grid">
                      {pageTrainings.map((training) => (
                        <article
                          key={training.id}
                          className={[
                            'card-training',
                            module.hasAccess ? '' : 'card-training-locked',
                          ].join(' ')}
                        >
                          <div className={module.hasAccess ? '' : 'training-card-disabled'}>
                            <div className="relative h-52 w-full overflow-hidden bg-white/5">
                              {training.imageUrl ? (
                                <img
                                  src={training.imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : null}

                              <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/20 to-black/55" />

                              {!canViewResults ? (
                                <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                                  <span className="chip-overlay">
                                    <Clock3 className="h-4 w-4 text-white" />
                                    {formatDuration(training.minutes)}
                                  </span>
                                  <span
                                    className={[
                                      'chip-overlay',
                                      training.completed
                                        ? 'chip-overlay-success'
                                        : 'chip-overlay-muted',
                                    ].join(' ')}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    {training.completed ? 'Concluído' : 'Pendente'}
                                  </span>
                                </div>
                              ) : null}
                            </div>

                            <div className="p-6">
                              <h4 className="text-lg font-semibold text-white">{training.title}</h4>
                              <p className="mt-3 text-sm leading-6 text-white/65">
                                {training.description}
                              </p>

                              <div className="training-card-actions mt-6">
                                {canViewResults ? (
                                  module.comingSoon ? (
                                    <span className="training-results-btn training-results-btn-disabled">
                                      Disponível em breve
                                    </span>
                                  ) : module.hasAccess ? (
                                    <Link
                                      to={`/app/trainings/${module.id}/${training.id}/results`}
                                      className="training-results-btn training-results-btn-active"
                                    >
                                      Ver resultados
                                    </Link>
                                  ) : (
                                    <span className="training-results-btn training-results-btn-disabled">
                                      Resultados indisponíveis
                                    </span>
                                  )
                                ) : (
                                  <button
                                    type="button"
                                    disabled={!training.enabled || !module.hasAccess}
                                    className={[
                                      'training-launch-btn',
                                      training.enabled && module.hasAccess
                                        ? 'training-launch-btn-active'
                                        : 'training-launch-btn-disabled',
                                    ].join(' ')}
                                    onClick={() => {
                                      if (!training.enabled || !module.hasAccess) return;
                                      window.open(training.url, '_blank', 'noopener,noreferrer');
                                    }}
                                  >
                                    {module.comingSoon
                                      ? 'Disponível em breve'
                                      : module.hasAccess
                                      ? training.enabled
                                        ? 'Iniciar treinamento'
                                        : 'Disponível em breve'
                                      : 'Módulo indisponível'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {!module.hasAccess ? (
                            <div className="training-card-overlay">
                              <span className="training-card-overlay-pill">
                                {module.comingSoon ? 'Em breve' : 'Módulo não contratado'}
                              </span>
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
