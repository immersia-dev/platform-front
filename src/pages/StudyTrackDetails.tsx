import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  MonitorUp,
  Play,
  Smartphone,
  UsersRound,
  Video,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../auth/useAuth';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { fetchTrainingLaunch, getApiErrorMessage } from '../lib/apiClient';
import {
  canManageGroupTrackAssignments,
  getAssignedTrackIdsForGroup,
  getCurrentUserRecord,
  getGroupTrackProgress,
  getLaunchTypeLabel,
  getLearnerAssignedTracks,
  getLearnerTrackProgress,
  getLessonImmersiveTraining,
  getLessonMaterial,
  getLessonProgressStatus,
  getMaterialKindLabel,
  getScopedGroupsForUser,
  getTrackById,
  getTrackCatalogItem,
  getTrackLessons,
  isModuleComingSoon,
} from '../lib/studyPlatform';
import { useLessonProgress } from '../study/useLessonProgress';

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}min`;
}

function getProgressLabel(percent: number) {
  if (percent === 100) return 'Concluída';
  if (percent > 0) return 'Em andamento';
  return 'Pendente';
}

function getProgressPillClass(percent: number) {
  if (percent === 100) return 'status-pill status-pill-success';
  if (percent > 0) return 'status-pill border-amber-300/20 bg-amber-400/10 text-amber-100';
  return 'status-pill status-pill-muted';
}

function getLessonStatusLabel(status: string) {
  if (status === 'completed') return 'Concluída';
  if (status === 'in_progress') return 'Em andamento';
  return 'Pendente';
}

function getLessonStatusClass(status: string) {
  if (status === 'completed') return 'status-pill status-pill-success';
  if (status === 'in_progress') {
    return 'status-pill border-amber-300/20 bg-amber-400/10 text-amber-100';
  }
  return 'status-pill status-pill-muted';
}

function getMaterialIcon(kind: string) {
  if (kind === 'pdf') return FileText;
  if (kind === 'video') return Video;
  if (kind === 'image') return ImageIcon;
  return LinkIcon;
}

type MetaLaunchState = {
  lessonTitle: string;
  launchUrl: string;
  resultCallbackUrl: string;
  contractVersion: string;
};

export default function StudyTrackDetails() {
  const { accessToken, user } = useAuth();
  const { trackId = '' } = useParams();
  const { progressError, progressRecords, setLessonStatus } = useLessonProgress();
  const [launchingLessonId, setLaunchingLessonId] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState('');
  const [metaLaunch, setMetaLaunch] = useState<MetaLaunchState | null>(null);
  const [copyStatus, setCopyStatus] = useState('');

  if (!user) return null;

  const activeRole = user.role;
  const track = getTrackById(trackId);
  const catalogItem = track ? getTrackCatalogItem(track) : null;
  const currentUserRecord = getCurrentUserRecord(user);
  const learnerTrackIds =
    user.role === 'learner' ? new Set(getLearnerAssignedTracks(user).map((item) => item.id)) : new Set<string>();
  const scopedGroups = getScopedGroupsForUser(user);
  const assignedGroups = scopedGroups.filter((group) =>
    getAssignedTrackIdsForGroup(group.id).includes(trackId)
  );
  const canViewTrack =
    user.role === 'super_admin' ||
    assignedGroups.length > 0 ||
    (user.role === 'learner' && learnerTrackIds.has(trackId));

  if (!track || !catalogItem || !canViewTrack) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Trilha não encontrada"
          description="A trilha solicitada não está disponível para o seu perfil."
          actions={
            <Link to="/app/studies" className="secondary-btn">
              <ArrowLeft className="h-4 w-4" />
              Voltar para estudos
            </Link>
          }
        />
      </div>
    );
  }

  const lessons = getTrackLessons(track.id);
  const learnerProgress =
    user.role === 'learner' && currentUserRecord
      ? getLearnerTrackProgress(track.id, currentUserRecord.id, progressRecords)
      : null;
  const visibleGroups =
    user.role === 'super_admin'
      ? scopedGroups.filter((group) => getAssignedTrackIdsForGroup(group.id).includes(track.id))
      : assignedGroups.filter((group) => canManageGroupTrackAssignments(user, group));
  const averageGroupProgress = visibleGroups.length
    ? Math.round(
        visibleGroups.reduce(
          (total, group) => total + getGroupTrackProgress(group.id, track.id, progressRecords).percent,
          0
        ) / visibleGroups.length
      )
    : 0;
  const progressPercent = learnerProgress?.percent ?? 0;
  const moduleComingSoon = isModuleComingSoon(track.moduleId);

  function handleOpenMaterial(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function handleLaunchTraining(lessonId: string, trainingId: string, lessonTitle: string) {
    if (!accessToken || launchingLessonId) return;

    setLaunchingLessonId(lessonId);
    setLaunchError('');
    setCopyStatus('');

    try {
      const launch = await fetchTrainingLaunch(accessToken, trainingId);

      if (!launch.enabled || !launch.launch_url) {
        setLaunchError(launch.unavailable_reason ?? 'Canal de execução indisponível.');
        return;
      }

      if (currentUserRecord && activeRole === 'learner') {
        setLessonStatus(currentUserRecord.id, lessonId, 'in_progress');
      }

      if (launch.launch_type === 'meta_app') {
        setMetaLaunch({
          lessonTitle,
          launchUrl: launch.launch_url,
          resultCallbackUrl: launch.result_callback_url,
          contractVersion: launch.result_contract_version,
        });
        return;
      }

      window.open(launch.launch_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setLaunchError(getApiErrorMessage(error, 'Não foi possível abrir o treinamento.'));
    } finally {
      setLaunchingLessonId(null);
    }
  }

  async function copyMetaLaunchDetails() {
    if (!metaLaunch) return;

    const details = [
      `Launch: ${metaLaunch.launchUrl}`,
      `Result callback: ${metaLaunch.resultCallbackUrl}`,
      `Contract: ${metaLaunch.contractVersion}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(details);
      setCopyStatus('Dados copiados.');
    } catch {
      setCopyStatus('Não foi possível copiar automaticamente.');
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={catalogItem.module.name}
        title={track.title}
        description={track.summary}
        actions={
          <Link to="/app/studies" className="secondary-btn">
            <ArrowLeft className="h-4 w-4" />
            Voltar para estudos
          </Link>
        }
      />

      <section className="training-hero">
        <div>
          <p className="section-kicker">Trilha de estudo</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">{track.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{track.summary}</p>

          {learnerProgress ? (
            <>
              <div className="analytics-bar-track mt-8">
                <div className="analytics-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <span className={getProgressPillClass(progressPercent)}>
                  {getProgressLabel(progressPercent)}
                </span>
                <span className="chip chip-muted">{progressPercent}% concluído</span>
                <span className="chip chip-muted">{formatDuration(catalogItem.durationMinutes)}</span>
              </div>
            </>
          ) : (
            <div className="mt-8 flex flex-wrap gap-3">
              {moduleComingSoon ? (
                <span className="status-pill status-pill-muted">Em breve</span>
              ) : (
                <span className="status-pill status-pill-success">Disponível</span>
              )}
              <span className="chip chip-muted">{formatDuration(catalogItem.durationMinutes)}</span>
              {visibleGroups.length ? (
                <span className="chip chip-muted">
                  Média das turmas: {averageGroupProgress}% concluído
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Aulas"
            value={`${lessons.length}`}
            caption="Obrigatórias."
            tooltip="Quantidade de aulas que compõem esta trilha."
            icon={BookOpenCheck}
          />
          <StatCard
            label="Materiais"
            value={`${catalogItem.materialCount}`}
            caption="PDF, vídeo, imagem ou link."
            tooltip="Materiais de estudo incluídos na trilha."
            icon={FileText}
          />
          <StatCard
            label="Práticas"
            value={`${catalogItem.trainingCount}`}
            caption="Treinamentos VR."
            tooltip="Atividades imersivas incluídas na trilha."
            icon={Play}
          />
          <StatCard
            label={user.role === 'learner' ? 'Progresso' : 'Turmas'}
            value={user.role === 'learner' ? `${progressPercent}%` : `${visibleGroups.length}`}
            caption={user.role === 'learner' ? 'Individual.' : 'Com esta trilha.'}
            tooltip="Indicador de acompanhamento da trilha no escopo atual."
            icon={UsersRound}
          />
        </div>
      </section>

      <section className="admin-card">
        <p className="section-kicker">Aulas</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Sequência da trilha</h2>

        {progressError ? (
          <div className="mt-6 rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {progressError}
          </div>
        ) : null}

        {launchError ? (
          <div className="mt-6 rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {launchError}
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          {lessons.map((lesson) => {
            const material = getLessonMaterial(lesson);
            const training = getLessonImmersiveTraining(lesson);
            const lessonStatus =
              user.role === 'learner' && currentUserRecord
                ? getLessonProgressStatus(currentUserRecord.id, lesson, progressRecords)
                : 'not_started';
            const MaterialIcon = material ? getMaterialIcon(material.kind) : FileText;
            const canLaunchTraining = Boolean(training?.enabled && training.launchUrl);
            const resultPath =
              training?.legacyTrainingId && training.moduleId
                ? `/app/trainings/${training.moduleId}/${training.legacyTrainingId}/results`
                : null;

            return (
              <article key={lesson.id} className="analytics-row">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="analytics-activity-icon">
                      {lesson.kind === 'study_material' ? (
                        <MaterialIcon className="h-5 w-5" />
                      ) : training?.launchType === 'meta_app' ? (
                        <Smartphone className="h-5 w-5" />
                      ) : (
                        <MonitorUp className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="chip chip-muted">Aula {lesson.order}</span>
                        <span className="chip chip-accent">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatDuration(lesson.durationMinutes)}
                        </span>
                        {material ? (
                          <span className="chip chip-muted">{getMaterialKindLabel(material.kind)}</span>
                        ) : null}
                        {training ? (
                          <span className="chip chip-muted">{getLaunchTypeLabel(training.launchType)}</span>
                        ) : null}
                      </div>

                      <h3 className="mt-4 text-xl font-semibold text-white">{lesson.title}</h3>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">
                        {lesson.description}
                      </p>

                      {material ? (
                        <p className="mt-3 text-sm text-white/45">{material.description}</p>
                      ) : null}

                      {training ? (
                        <p className="mt-3 text-sm text-white/45">{training.description}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 lg:min-w-56">
                    {user.role === 'learner' ? (
                      <span className={getLessonStatusClass(lessonStatus)}>
                        {getLessonStatusLabel(lessonStatus)}
                      </span>
                    ) : null}

                    {material ? (
                      <>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => handleOpenMaterial(material.url)}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Abrir material
                        </button>

                        {user.role === 'learner' && currentUserRecord ? (
                          <button
                            type="button"
                            className="primary-btn"
                            disabled={lessonStatus === 'completed'}
                            onClick={() =>
                              setLessonStatus(currentUserRecord.id, lesson.id, 'completed')
                            }
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {lessonStatus === 'completed' ? 'Aula concluída' : 'Concluir aula'}
                          </button>
                        ) : null}
                      </>
                    ) : null}

                    {training ? (
                      <>
                        <button
                          type="button"
                          className={[
                            'training-result-launch-btn',
                            canLaunchTraining
                              ? 'training-result-launch-btn-active'
                              : 'training-result-launch-btn-disabled',
                          ].join(' ')}
                          disabled={!canLaunchTraining || launchingLessonId === lesson.id}
                          onClick={() => {
                            if (!canLaunchTraining) return;
                            void handleLaunchTraining(lesson.id, training.id, lesson.title);
                          }}
                        >
                          <Play className="h-4 w-4" />
                          {launchingLessonId === lesson.id
                            ? 'Abrindo...'
                            : !canLaunchTraining && moduleComingSoon
                              ? 'Em breve'
                              : training.launchType === 'meta_app'
                                ? 'Abrir no Meta Quest'
                                : 'Abrir treinamento'}
                        </button>

                        {!canLaunchTraining ? (
                          <p className="text-sm text-white/45">
                            {moduleComingSoon
                              ? 'Treinamento em desenvolvimento, disponível em breve.'
                              : 'Canal de execução indisponível.'}
                          </p>
                        ) : null}

                        {user.role !== 'learner' && resultPath ? (
                          <Link to={resultPath} className="secondary-btn">
                            Ver resultados
                          </Link>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {user.role !== 'learner' ? (
        <section className="table-shell">
          <div className="table-shell-header">
            <div>
              <h2 className="text-lg font-semibold text-white">Progresso por turma</h2>
              <p className="mt-1 text-sm text-white/60">
                Acompanhamento das turmas que receberam esta trilha.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table data-table-centered">
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Alunos</th>
                  <th>Concluídos</th>
                  <th>Em andamento</th>
                  <th>Pendentes</th>
                  <th>Progresso</th>
                </tr>
              </thead>
              <tbody>
                {visibleGroups.map((group) => {
                  const progress = getGroupTrackProgress(group.id, track.id, progressRecords);

                  return (
                    <tr key={group.id}>
                      <td>
                        <div className="font-semibold text-white">{group.name}</div>
                        <div className="mt-1 text-xs text-white/50">{group.code}</div>
                      </td>
                      <td>{progress.learners.length}</td>
                      <td>{progress.completedLearners}</td>
                      <td>{progress.inProgressLearners}</td>
                      <td>{progress.pendingLearners}</td>
                      <td>
                        <span className={getProgressPillClass(progress.percent)}>
                          {progress.percent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!visibleGroups.length ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="py-6 text-center text-sm text-white/55">
                        Nenhuma turma no escopo atual recebeu esta trilha.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {metaLaunch ? (
        <div className="dialog-backdrop" role="dialog" aria-modal="true">
          <div className="dialog-panel max-w-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Meta Quest (app Immersia)</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">{metaLaunch.lessonTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Coloque o Meta Quest e abra o app Immersia pelo link abaixo. Ao finalizar, o
                  resultado é enviado automaticamente para a plataforma.
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Fechar"
                onClick={() => setMetaLaunch(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="readonly-field">
                <span className="readonly-field-label">Link de abertura</span>
                <span className="mt-2 block break-all text-sm font-semibold text-white">
                  {metaLaunch.launchUrl}
                </span>
              </div>
              <div className="readonly-field">
                <span className="readonly-field-label">Callback de resultado</span>
                <span className="mt-2 block break-all text-sm font-semibold text-white">
                  POST {metaLaunch.resultCallbackUrl}
                </span>
              </div>
              <div className="readonly-field">
                <span className="readonly-field-label">Versão do contrato</span>
                <span className="mt-2 block text-sm font-semibold text-white">
                  {metaLaunch.contractVersion}
                </span>
              </div>
            </div>

            {copyStatus ? <p className="mt-4 text-sm text-white/60">{copyStatus}</p> : null}

            <div className="dialog-actions">
              <button type="button" className="secondary-btn" onClick={() => void copyMetaLaunchDetails()}>
                <Copy className="h-4 w-4" />
                Copiar dados
              </button>
              <button
                type="button"
                className="primary-btn sm:w-auto"
                onClick={() => {
                  window.location.href = metaLaunch.launchUrl;
                }}
              >
                <Smartphone className="h-4 w-4" />
                Abrir no Meta Quest
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
