import { BookOpenCheck, FileText, Layers3, Play, Plus } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

import { useAuth } from '../auth/useAuth';
import { usePlatformData } from '../data/PlatformDataContext';
import {
  modulesSeed,
  type LaunchType,
  type MaterialKind,
} from '../data/mockPlatform';
import { createStudyPackage, getApiErrorMessage } from '../lib/apiClient';

type FieldProps = {
  label: string;
  children: ReactNode;
};

type ModuleMode = 'existing' | 'new';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="profile-field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function GeneratedIdentifier({ value }: { value: string }) {
  return (
    <div className="profile-field">
      <span className="field-label">Identificador (gerado do título)</span>
      <div
        className="admin-input flex items-center text-white/55"
        aria-live="polite"
      >
        {value || 'Preencha o título'}
      </div>
    </div>
  );
}

function createInitialForm(firstModuleId: string) {
  return {
    moduleMode: 'existing' as ModuleMode,
    moduleId: firstModuleId,
    moduleName: '',
    moduleSummary: '',
    moduleIsActive: true,
    trackTitle: '',
    trackSummary: '',
    trackLevel: 'introductory' as 'introductory' | 'operational' | 'advanced',
    trackImageUrl: '',
    includeMaterial: true,
    materialKind: 'link' as MaterialKind,
    materialTitle: '',
    materialDescription: '',
    materialUrl: '',
    materialThumbnailUrl: '',
    materialDurationMinutes: 8,
    materialRequired: true,
    trainingTitle: '',
    trainingDescription: '',
    trainingMinutes: 10,
    trainingLaunchType: 'meta_app' as LaunchType,
    trainingLaunchUrl: '',
    trainingEnabled: true,
    trainingRequired: true,
  };
}

export default function StudyCatalogAdmin() {
  const { accessToken } = useAuth();
  const platformData = usePlatformData();
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(() =>
    createInitialForm(modulesSeed[0]?.id ?? '')
  );

  useEffect(() => {
    const firstModuleId = modulesSeed[0]?.id ?? '';
    setForm((current) => ({
      ...current,
      moduleId: current.moduleId || firstModuleId,
    }));
  }, [platformData.version]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || isSubmitting) return;

    setIsSubmitting(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      await createStudyPackage(accessToken, {
        moduleMode: form.moduleMode,
        moduleId: form.moduleId,
        module: {
          name: form.moduleName,
          slug: slugify(form.moduleName),
          summary: form.moduleSummary,
          isActive: form.moduleIsActive,
        },
        track: {
          moduleId: form.moduleId,
          title: form.trackTitle,
          slug: slugify(form.trackTitle),
          summary: form.trackSummary,
          level: form.trackLevel,
          imageUrl: form.trackImageUrl,
        },
        includeMaterial: form.includeMaterial,
        material: {
          kind: form.materialKind,
          title: form.materialTitle,
          description: form.materialDescription,
          url: form.materialUrl,
          thumbnailUrl: form.materialThumbnailUrl,
          // A aula de material usa o mesmo título e descrição do material.
          lessonTitle: form.materialTitle,
          lessonDescription: form.materialDescription,
          durationMinutes: form.materialDurationMinutes,
          required: form.materialRequired,
        },
        training: {
          moduleId: form.moduleId,
          title: form.trainingTitle,
          description: form.trainingDescription,
          minutes: form.trainingMinutes,
          launchType: form.trainingLaunchType,
          launchUrl: form.trainingLaunchUrl,
          enabled: form.trainingEnabled,
          // A prática usa a capa da trilha; o identificador legado não é exposto aqui.
          imageUrl: form.trackImageUrl,
          legacyTrainingId: '',
          lessonTitle: form.trainingTitle,
          lessonDescription: form.trainingDescription,
          durationMinutes: form.trainingMinutes,
          required: form.trainingRequired,
        },
      });
      await platformData.refresh();
      setStatusMessage('Jornada criada com trilha, aulas e prática imersiva.');
      setForm(
        createInitialForm(
          form.moduleMode === 'existing'
            ? form.moduleId
            : (modulesSeed[0]?.id ?? '')
        )
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, 'Não foi possível criar a jornada.')
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="admin-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="section-kicker">Curadoria</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Nova jornada de estudo
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            Crie uma trilha completa com material preparatório opcional e
            prática imersiva.
          </p>
        </div>
        <span className="chip chip-muted">Super admin</span>
      </div>

      {statusMessage ? (
        <div className="mt-6 rounded-[20px] border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-6 rounded-[20px] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {errorMessage}
        </div>
      ) : null}

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div className="analytics-row space-y-5">
          <div className="flex items-center gap-3">
            <span className="analytics-activity-icon">
              <Layers3 className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold text-white">Módulo</h3>
          </div>

          <div className="analytics-tabs">
            <button
              type="button"
              className={[
                'analytics-tab',
                form.moduleMode === 'existing' ? 'analytics-tab-active' : '',
              ].join(' ')}
              onClick={() => setForm({ ...form, moduleMode: 'existing' })}
            >
              Existente
            </button>
            <button
              type="button"
              className={[
                'analytics-tab',
                form.moduleMode === 'new' ? 'analytics-tab-active' : '',
              ].join(' ')}
              onClick={() => setForm({ ...form, moduleMode: 'new' })}
            >
              Novo
            </button>
          </div>

          {form.moduleMode === 'existing' ? (
            <Field label="Módulo">
              <select
                className="admin-select"
                value={form.moduleId}
                onChange={(event) =>
                  setForm({ ...form, moduleId: event.target.value })
                }
                required
              >
                {modulesSeed.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome do módulo">
                  <input
                    className="admin-input"
                    value={form.moduleName}
                    onChange={(event) =>
                      setForm({ ...form, moduleName: event.target.value })
                    }
                    placeholder="Ex.: NR-12"
                    required={form.moduleMode === 'new'}
                  />
                </Field>
                <GeneratedIdentifier value={slugify(form.moduleName)} />
              </div>
              <Field label="Resumo do módulo">
                <textarea
                  className="admin-input min-h-24"
                  value={form.moduleSummary}
                  onChange={(event) =>
                    setForm({ ...form, moduleSummary: event.target.value })
                  }
                />
              </Field>
              <label className="flex items-center gap-3 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={form.moduleIsActive}
                  onChange={(event) =>
                    setForm({ ...form, moduleIsActive: event.target.checked })
                  }
                />
                Módulo ativo
              </label>
            </>
          )}
        </div>

        <div className="analytics-row space-y-5">
          <div className="flex items-center gap-3">
            <span className="analytics-activity-icon">
              <BookOpenCheck className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold text-white">Trilha</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Título da trilha">
              <input
                className="admin-input"
                value={form.trackTitle}
                onChange={(event) =>
                  setForm({ ...form, trackTitle: event.target.value })
                }
                required
              />
            </Field>
            <GeneratedIdentifier value={slugify(form.trackTitle)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nível">
              <select
                className="admin-select"
                value={form.trackLevel}
                onChange={(event) =>
                  setForm({
                    ...form,
                    trackLevel: event.target.value as typeof form.trackLevel,
                  })
                }
              >
                <option value="introductory">Introdutório</option>
                <option value="operational">Operacional</option>
                <option value="advanced">Avançado</option>
              </select>
            </Field>
            <Field label="Imagem de capa (link)">
              <input
                className="admin-input"
                placeholder="https://..."
                value={form.trackImageUrl}
                onChange={(event) =>
                  setForm({ ...form, trackImageUrl: event.target.value })
                }
              />
            </Field>
          </div>

          <Field label="Resumo da trilha">
            <textarea
              className="admin-input min-h-24"
              value={form.trackSummary}
              onChange={(event) =>
                setForm({ ...form, trackSummary: event.target.value })
              }
            />
          </Field>
        </div>

        <div className="analytics-row space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="analytics-activity-icon">
                <FileText className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold text-white">
                Material preparatório
              </h3>
            </div>
            <label className="flex items-center gap-3 text-sm text-white/75">
              <input
                type="checkbox"
                checked={form.includeMaterial}
                onChange={(event) =>
                  setForm({ ...form, includeMaterial: event.target.checked })
                }
              />
              Incluir material
            </label>
          </div>

          {form.includeMaterial ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Tipo">
                  <select
                    className="admin-select"
                    value={form.materialKind}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        materialKind: event.target.value as MaterialKind,
                      })
                    }
                  >
                    <option value="pdf">PDF</option>
                    <option value="video">Vídeo</option>
                    <option value="image">Imagem</option>
                    <option value="link">Link</option>
                  </select>
                </Field>
                <Field label="Título do material">
                  <input
                    className="admin-input"
                    value={form.materialTitle}
                    onChange={(event) =>
                      setForm({ ...form, materialTitle: event.target.value })
                    }
                    required={form.includeMaterial}
                  />
                </Field>
              </div>
              <Field label="Link do material">
                <input
                  className="admin-input"
                  placeholder="https://..."
                  value={form.materialUrl}
                  onChange={(event) =>
                    setForm({ ...form, materialUrl: event.target.value })
                  }
                  required={form.includeMaterial}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Duração de estudo (min)">
                  <input
                    className="admin-input"
                    type="number"
                    min={1}
                    value={form.materialDurationMinutes}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        materialDurationMinutes: Number(event.target.value),
                      })
                    }
                    required={form.includeMaterial}
                  />
                </Field>
                <Field label="Miniatura (link da imagem, opcional)">
                  <input
                    className="admin-input"
                    placeholder="https://..."
                    value={form.materialThumbnailUrl}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        materialThumbnailUrl: event.target.value,
                      })
                    }
                  />
                </Field>
              </div>
              <Field label="Descrição">
                <textarea
                  className="admin-input min-h-24"
                  value={form.materialDescription}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      materialDescription: event.target.value,
                    })
                  }
                />
              </Field>
              <label className="flex items-center gap-3 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={form.materialRequired}
                  onChange={(event) =>
                    setForm({ ...form, materialRequired: event.target.checked })
                  }
                />
                Aula obrigatória
              </label>
            </>
          ) : null}
        </div>

        <div className="analytics-row space-y-5">
          <div className="flex items-center gap-3">
            <span className="analytics-activity-icon">
              <Play className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold text-white">
              Prática imersiva
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Título do treinamento">
              <input
                className="admin-input"
                value={form.trainingTitle}
                onChange={(event) =>
                  setForm({ ...form, trainingTitle: event.target.value })
                }
                required
              />
            </Field>
            <Field label="Execução">
              <select
                className="admin-select"
                value={form.trainingLaunchType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    trainingLaunchType: event.target.value as LaunchType,
                  })
                }
              >
                <option value="meta_app">Meta Quest (app Immersia)</option>
                <option value="web_url">Navegador (web)</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label={
                form.trainingLaunchType === 'meta_app'
                  ? 'Link do treinamento no app (fornecido pela equipe Immersia)'
                  : 'Link do treinamento'
              }
            >
              <input
                className="admin-input"
                value={form.trainingLaunchUrl}
                onChange={(event) =>
                  setForm({ ...form, trainingLaunchUrl: event.target.value })
                }
                placeholder={
                  form.trainingLaunchType === 'meta_app'
                    ? 'Deixe em branco se ainda não houver'
                    : 'https://...'
                }
              />
            </Field>
            <Field label="Duração (min)">
              <input
                className="admin-input"
                type="number"
                min={1}
                value={form.trainingMinutes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    trainingMinutes: Number(event.target.value),
                  })
                }
                required
              />
            </Field>
          </div>

          <Field label="Descrição">
            <textarea
              className="admin-input min-h-24"
              value={form.trainingDescription}
              onChange={(event) =>
                setForm({ ...form, trainingDescription: event.target.value })
              }
            />
          </Field>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-3 text-sm text-white/75">
              <input
                type="checkbox"
                checked={form.trainingEnabled}
                onChange={(event) =>
                  setForm({ ...form, trainingEnabled: event.target.checked })
                }
              />
              Liberado para os alunos (desmarque para exibir como "Em breve")
            </label>
            <label className="flex items-center gap-3 text-sm text-white/75">
              <input
                type="checkbox"
                checked={form.trainingRequired}
                onChange={(event) =>
                  setForm({ ...form, trainingRequired: event.target.checked })
                }
              />
              Aula obrigatória
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="primary-btn sm:w-auto sm:px-6"
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4" />
            {isSubmitting ? 'Criando...' : 'Criar jornada'}
          </button>
        </div>
      </form>
    </section>
  );
}
