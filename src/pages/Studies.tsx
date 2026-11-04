import {
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Layers3,
  Play,
  Search,
  UsersRound,
} from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/useAuth';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StudyCatalogAdmin from '../components/StudyCatalogAdmin';
import { studyTracksSeed } from '../data/mockPlatform';
import {
  getAssignedTracksForGroup,
  getCurrentUserRecord,
  getGroupAverageTrackProgress,
  getGroupLearners,
  getGroupTrackProgress,
  getLearnerActiveGroup,
  getLearnerAssignedTracks,
  getLearnerTrackProgress,
  getNextLessonForLearner,
  getScopedGroupsForUser,
  getTrackCatalogItems,
  getTrackLessons,
  type TrackCatalogItem,
} from '../lib/studyPlatform';
import { useLessonProgress } from '../study/useLessonProgress';

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}min`;
}

function getProgressLabel(percent: number) {
  if (percent === 100) return 'Concluida';
  if (percent > 0) return 'Em andamento';
  return 'Pendente';
}

function getProgressPillClass(percent: number) {
  if (percent === 100) return 'status-pill status-pill-success';
  if (percent > 0) return 'status-pill border-amber-300/20 bg-amber-400/10 text-amber-100';
  return 'status-pill status-pill-muted';
}

function trackMatchesSearch(item: TrackCatalogItem, searchTerm: string) {
  if (!searchTerm) return true;

  return `${item.module.name} ${item.track.title} ${item.track.summary}`
    .toLowerCase()
    .includes(searchTerm);
}

export default function Studies() {
  const { user } = useAuth();
  const { progressRecords } = useLessonProgress();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  if (!user) return null;

  const currentUserRecord = getCurrentUserRecord(user);

  if (user.role === 'learner') {
    const learnerTracks = getTrackCatalogItems(getLearnerAssignedTracks(user)).filter((item) =>
      trackMatchesSearch(item, deferredSearch)
    );
    const activeGroup = currentUserRecord ? getLearnerActiveGroup(currentUserRecord.id) : null;
    const averageProgress = currentUserRecord
      ? Math.round(
          learnerTracks.reduce(
            (total, item) =>
              total + getLearnerTrackProgress(item.track.id, currentUserRecord.id, progressRecords).percent,
            0
          ) / Math.max(learnerTracks.length, 1)
        )
      : 0;
    const completedTracks = currentUserRecord
      ? learnerTracks.filter(
          (item) => getLearnerTrackProgress(item.track.id, currentUserRecord.id, progressRecords).percent === 100
        ).length
      : 0;

    return (
      <div className="space-y-8">
        <PageHeader
          title="Estudos"
          description={
            activeGroup
              ? `Trilhas encaminhadas para ${activeGroup.name}.`
              : 'Nenhuma turma ativa encontrada para sua jornada.'
          }
        />

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Trilhas"
            value={`${learnerTracks.length}`}
            caption="Encaminhadas para sua turma."
            tooltip="Total de trilhas liberadas para a turma ativa do aluno."
            icon={BookOpenCheck}
          />
          <StatCard
            label="Progresso"
            value={`${averageProgress}%`}
            caption="Media da sua jornada."
            tooltip="Percentual medio de aulas obrigatorias concluidas nas trilhas atribuidas."
            icon={GraduationCap}
          />
          <StatCard
            label="Concluidas"
            value={`${completedTracks}`}
            caption="Trilhas finalizadas."
            tooltip="Trilhas em que todas as aulas obrigatorias foram concluidas."
            icon={CheckCircle2}
          />
        </section>

        <section className="gallery-toolbar-shell">
          <div>
            <h2 className="text-lg font-semibold text-white">Minha jornada</h2>
            <p className="mt-2 text-sm text-white/60">
              Continue pelos materiais e atividades encaminhados para sua turma.
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
                placeholder="Buscar trilha ou modulo"
              />
            </div>
          </div>
        </section>

        {learnerTracks.length ? (
          <section className="module-grid">
            {learnerTracks.map((item) => {
              const progress = currentUserRecord
                ? getLearnerTrackProgress(item.track.id, currentUserRecord.id, progressRecords)
                : null;
              const nextLesson = currentUserRecord
                ? getNextLessonForLearner(item.track.id, currentUserRecord.id, progressRecords)
                : null;
              const progressPercent = progress?.percent ?? 0;

              return (
                <article key={item.track.id} className="card-training">
                  <div className="relative h-48 w-full overflow-hidden bg-white/5">
                    {item.track.imageUrl ? (
                      <img
                        src={item.track.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/15 to-black/60" />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className="chip-overlay">{item.module.name}</span>
                      <span className="chip-overlay">
                        <Clock3 className="h-4 w-4" />
                        {formatDuration(item.durationMinutes)}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{item.track.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-white/65">{item.track.summary}</p>
                      </div>
                      <span className={getProgressPillClass(progressPercent)}>
                        {getProgressLabel(progressPercent)}
                      </span>
                    </div>

                    <div className="analytics-bar-track">
                      <div className="analytics-bar-fill" style={{ width: `${progressPercent}%` }} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.14em] text-white/45">
                      <span>{progressPercent}% concluido</span>
                      <span>{item.lessons.length} aulas</span>
                      {nextLesson ? <span>Proxima: {nextLesson.title}</span> : null}
                    </div>

                    <Link to={`/app/studies/${item.track.id}`} className="primary-btn mt-6">
                      <Play className="h-4 w-4" />
                      Continuar estudos
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="empty-state">
            <h3 className="text-xl font-semibold text-white">Nenhuma trilha encontrada</h3>
            <p className="mt-3 max-w-xl text-sm text-white/65">
              Ajuste a busca ou aguarde novas trilhas serem encaminhadas para sua turma.
            </p>
          </section>
        )}
      </div>
    );
  }

  if (user.role === 'super_admin') {
    const catalogItems = getTrackCatalogItems(studyTracksSeed).filter((item) =>
      trackMatchesSearch(item, deferredSearch)
    );
    const totalLessons = studyTracksSeed.reduce(
      (total, track) => total + getTrackLessons(track.id).length,
      0
    );
    const totalTrainings = catalogItems.reduce((total, item) => total + item.trainingCount, 0);
    const moduleCount = new Set(catalogItems.map((item) => item.module.id)).size;

    return (
      <div className="space-y-8">
        <PageHeader
          title="Estudos"
          description="Catalogo de modulos, trilhas, materiais e treinamentos da plataforma."
        />

        <StudyCatalogAdmin />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Modulos"
            value={`${moduleCount}`}
            caption="Agrupadores contrataveis."
            tooltip="Modulos do catalogo que podem ser liberados para organizacoes."
            icon={Layers3}
          />
          <StatCard
            label="Trilhas"
            value={`${catalogItems.length}`}
            caption="Jornadas de estudo."
            tooltip="Trilhas criadas dentro dos modulos da plataforma."
            icon={BookOpenCheck}
          />
          <StatCard
            label="Aulas"
            value={`${totalLessons}`}
            caption="Materiais e praticas."
            tooltip="Aulas obrigatorias ou praticas que compoem as trilhas."
            icon={FileText}
          />
          <StatCard
            label="Treinamentos"
            value={`${totalTrainings}`}
            caption="Web e Meta."
            tooltip="Atividades imersivas com canal de execucao definido no treinamento."
            icon={Play}
          />
        </section>

        <section className="gallery-toolbar-shell">
          <div>
            <h2 className="text-lg font-semibold text-white">Catalogo de estudos</h2>
            <p className="mt-2 text-sm text-white/60">
              Exibindo {catalogItems.length} trilhas disponiveis para curadoria.
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
                placeholder="Buscar por modulo ou trilha"
              />
            </div>
          </div>
        </section>

        <section className="module-grid">
          {catalogItems.map((item) => (
            <article key={item.track.id} className="card-training">
              <div className="p-6">
                <p className="section-kicker">{item.module.name}</p>
                <h3 className="mt-3 text-xl font-semibold text-white">{item.track.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/65">{item.track.summary}</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Aulas</span>
                    <strong className="analytics-mini-value">{item.lessons.length}</strong>
                  </div>
                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Materiais</span>
                    <strong className="analytics-mini-value">{item.materialCount}</strong>
                  </div>
                  <div className="analytics-mini-metric">
                    <span className="analytics-mini-label">Praticas</span>
                    <strong className="analytics-mini-value">{item.trainingCount}</strong>
                  </div>
                </div>

                <Link to={`/app/studies/${item.track.id}`} className="secondary-btn mt-6">
                  Ver trilha
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    );
  }

  const scopedGroups = getScopedGroupsForUser(user).filter((group) => group.status === 'active');
  const groupRows = scopedGroups.map((group) => {
    const tracks = getTrackCatalogItems(getAssignedTracksForGroup(group.id)).filter((item) =>
      trackMatchesSearch(item, deferredSearch)
    );
    const learners = getGroupLearners(group.id);
    const averageProgress = getGroupAverageTrackProgress(group.id);

    return {
      group,
      tracks,
      learners,
      averageProgress,
    };
  });
  const visibleRows = groupRows.filter(
    (row) =>
      row.tracks.length > 0 ||
      `${row.group.name} ${row.group.code}`.toLowerCase().includes(deferredSearch)
  );
  const assignedTrackCount = groupRows.reduce((total, row) => total + row.tracks.length, 0);
  const averageProgress = Math.round(
    groupRows.reduce((total, row) => total + row.averageProgress, 0) / Math.max(groupRows.length, 1)
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Estudos"
        description={
          user.role === 'instructor'
            ? 'Trilhas encaminhadas para suas turmas atribuidas.'
            : 'Trilhas encaminhadas para as turmas da organizacao.'
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Turmas"
          value={`${scopedGroups.length}`}
          caption="No seu escopo."
          tooltip="Turmas ativas que o perfil atual pode acompanhar."
          icon={UsersRound}
        />
        <StatCard
          label="Trilhas"
          value={`${assignedTrackCount}`}
          caption="Encaminhadas."
          tooltip="Total de trilhas encaminhadas para as turmas visiveis."
          icon={BookOpenCheck}
        />
        <StatCard
          label="Progresso"
          value={`${averageProgress}%`}
          caption="Media por turma."
          tooltip="Media de conclusao das trilhas encaminhadas para as turmas visiveis."
          icon={GraduationCap}
        />
      </section>

      <section className="gallery-toolbar-shell">
        <div>
          <h2 className="text-lg font-semibold text-white">Trilhas por turma</h2>
          <p className="mt-2 text-sm text-white/60">
            Acompanhe progresso, pendencias e atalhos para cada jornada encaminhada.
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
              placeholder="Buscar turma ou trilha"
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        {visibleRows.map((row) => (
          <article key={row.group.id} className="module-shell">
            <div className="module-header">
              <div>
                <p className="section-kicker">{row.group.code}</p>
                <h3 className="text-2xl font-semibold text-white">{row.group.name}</h3>
                <p className="mt-2 max-w-2xl text-sm text-white/65">{row.group.description}</p>
              </div>
              <Link to={`/app/groups/${row.group.id}`} className="secondary-btn">
                Gerenciar turma
              </Link>
            </div>

            {row.tracks.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {row.tracks.map((item) => {
                  const progress = getGroupTrackProgress(row.group.id, item.track.id, progressRecords);

                  return (
                    <div key={item.track.id} className="analytics-row">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="section-kicker">{item.module.name}</p>
                          <h4 className="mt-2 text-lg font-semibold text-white">{item.track.title}</h4>
                          <p className="mt-2 text-sm text-white/60">{item.track.summary}</p>
                        </div>
                        <span className={getProgressPillClass(progress.percent)}>
                          {getProgressLabel(progress.percent)}
                        </span>
                      </div>

                      <div className="analytics-bar-track">
                        <div className="analytics-bar-fill" style={{ width: `${progress.percent}%` }} />
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-4">
                        <div className="analytics-mini-metric">
                          <span className="analytics-mini-label">Alunos</span>
                          <strong className="analytics-mini-value">{progress.learners.length}</strong>
                        </div>
                        <div className="analytics-mini-metric">
                          <span className="analytics-mini-label">Concl.</span>
                          <strong className="analytics-mini-value">{progress.completedLearners}</strong>
                        </div>
                        <div className="analytics-mini-metric">
                          <span className="analytics-mini-label">Andam.</span>
                          <strong className="analytics-mini-value">{progress.inProgressLearners}</strong>
                        </div>
                        <div className="analytics-mini-metric">
                          <span className="analytics-mini-label">Pend.</span>
                          <strong className="analytics-mini-value">{progress.pendingLearners}</strong>
                        </div>
                      </div>

                      <Link to={`/app/studies/${item.track.id}`} className="secondary-btn mt-5">
                        Ver trilha
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <h4 className="text-lg font-semibold text-white">Sem trilhas encaminhadas</h4>
                <p className="mt-2 text-sm text-white/60">
                  Use os detalhes da turma para encaminhar trilhas completas.
                </p>
              </div>
            )}
          </article>
        ))}

        {!visibleRows.length ? (
          <section className="empty-state">
            <h3 className="text-xl font-semibold text-white">Nenhuma turma encontrada</h3>
            <p className="mt-3 max-w-xl text-sm text-white/65">
              Ajuste a busca ou confira se existem turmas atribuidas ao seu perfil.
            </p>
          </section>
        ) : null}
      </section>
    </div>
  );
}
