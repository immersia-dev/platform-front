import { BookOpenCheck, FileText, Layers3, Play, Plus } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

import { useAuth } from '../auth/useAuth';
import { usePlatformData } from '../data/PlatformDataContext';
import { modulesSeed, type LaunchType, type MaterialKind } from '../data/mockPlatform';
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

function createInitialForm(firstModuleId: string) {
  return {
    moduleMode: 'existing' as ModuleMode,
    moduleId: firstModuleId,
    moduleName: '',
    moduleSlug: '',
    moduleSummary: '',
    moduleIsActive: true,
    trackTitle: '',
    trackSlug: '',
    trackSummary: '',
    trackLevel: 'introductory' as 'introductory' | 'operational' | 'advanced',
    trackImageUrl: '',
    includeMaterial: true,
    materialKind: 'link' as MaterialKind,
    materialTitle: '',
    materialDescription: '',
    materialUrl: '',
    materialThumbnailUrl: '',
    materialLessonTitle: '',
    materialLessonDescription: '',
    materialDurationMinutes: 8,
    materialRequired: true,
    trainingTitle: '',
    trainingDescription: '',
    trainingMinutes: 10,
    trainingLaunchType: 'web_url' as LaunchType,
    trainingLaunchUrl: '',
    trainingEnabled: true,
    trainingImageUrl: '',
    trainingLegacyId: '',
    trainingLessonTitle: '',
    trainingLessonDescription: '',
    trainingDurationMinutes: 10,
    trainingRequired: true,
  };
}

export default function StudyCatalogAdmin() {
  const { accessToken } = useAuth();
  const platformData = usePlatformData();
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(() => createInitialForm(modulesSeed[0]?.id ?? ''));

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
          slug: form.moduleSlug,
          summary: form.moduleSummary,
          isActive: form.moduleIsActive,
        },
        track: {
          moduleId: form.moduleId,
          title: form.trackTitle,
          slug: form.trackSlug,
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
          lessonTitle: form.materialLessonTitle,
          lessonDescription: form.materialLessonDescription,
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
          imageUrl: form.trainingImageUrl,
          legacyTrainingId: form.trainingLegacyId,
          lessonTitle: form.trainingLessonTitle,
          lessonDescription: form.trainingLessonDescription,
          durationMinutes: form.trainingDurationMinutes,
          required: form.trainingRequired,
        },
      });
      await platformData.refresh();
      setStatusMessage('Jornada criada com trilha, aulas e pratica imersiva.');
      setForm(createInitialForm(form.moduleMode === 'existing' ? form.moduleId : modulesSeed[0]?.id ?? ''));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Nao foi possivel criar a jornada.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="admin-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="section-kicker">Curadoria</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Nova jornada de estudo</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            Crie uma trilha completa com material preparatorio opcional e pratica imersiva.
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
            <h3 className="text-lg font-semibold text-white">Modulo</h3>
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
            <Field label="Modulo">
              <select
                className="admin-select"
                value={form.moduleId}
                onChange={(event) => setForm({ ...form, moduleId: event.target.value })}
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
                <Field label="Nome do modulo">
                  <input
                    className="admin-input"
                    value={form.moduleName}
                    onBlur={() =>
                      setForm((current) => ({
                        ...current,
                        moduleSlug: current.moduleSlug || slugify(current.moduleName),
                      }))
                    }
                    onChange={(event) => setForm({ ...form, moduleName: event.target.value })}
                    required={form.moduleMode === 'new'}
                  />
                </Field>
                <Field label="Slug do modulo">
                  <input
                    className="admin-input"
                    value={form.moduleSlug}
                    onChange={(event) => setForm({ ...form, moduleSlug: event.target.value })}
                    required={form.moduleMode === 'new'}
                  />
                </Field>
              </div>
              <Field label="Resumo do modulo">
                <textarea
                  className="admin-input min-h-24"
                  value={form.moduleSummary}
                  onChange={(event) => setForm({ ...form, moduleSummary: event.target.value })}
                />
              </Field>
              <label className="flex items-center gap-3 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={form.moduleIsActive}
                  onChange={(event) => setForm({ ...form, moduleIsActive: event.target.checked })}
                />
                Modulo ativo
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
            <Field label="Titulo da trilha">
              <input
                className="admin-input"
                value={form.trackTitle}
                onBlur={() =>
                  setForm((current) => ({
                    ...current,
                    trackSlug: current.trackSlug || slugify(current.trackTitle),
                  }))
                }
                onChange={(event) => setForm({ ...form, trackTitle: event.target.value })}
                required
              />
            </Field>
            <Field label="Slug da trilha">
              <input
                className="admin-input"
                value={form.trackSlug}
                onChange={(event) => setForm({ ...form, trackSlug: event.target.value })}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nivel">
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
                <option value="introductory">Introdutorio</option>
                <option value="operational">Operacional</option>
                <option value="advanced">Avancado</option>
              </select>
            </Field>
            <Field label="Imagem URL">
              <input
                className="admin-input"
                value={form.trackImageUrl}
                onChange={(event) => setForm({ ...form, trackImageUrl: event.target.value })}
              />
            </Field>
          </div>

          <Field label="Resumo da trilha">
            <textarea
              className="admin-input min-h-24"
              value={form.trackSummary}
              onChange={(event) => setForm({ ...form, trackSummary: event.target.value })}
            />
          </Field>
        </div>

        <div className="analytics-row space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="analytics-activity-icon">
                <FileText className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold text-white">Material preparatorio</h3>
            </div>
            <label className="flex items-center gap-3 text-sm text-white/75">
              <input
                type="checkbox"
                checked={form.includeMaterial}
                onChange={(event) => setForm({ ...form, includeMaterial: event.target.checked })}
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
                      setForm({ ...form, materialKind: event.target.value as MaterialKind })
                    }
                  >
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                    <option value="image">Imagem</option>
                    <option value="link">Link</option>
                  </select>
                </Field>
                <Field label="Titulo do material">
                  <input
                    className="admin-input"
                    value={form.materialTitle}
                    onChange={(event) => setForm({ ...form, materialTitle: event.target.value })}
                    required={form.includeMaterial}
                  />
                </Field>
              </div>
              <Field label="URL do material">
                <input
                  className="admin-input"
                  value={form.materialUrl}
                  onChange={(event) => setForm({ ...form, materialUrl: event.target.value })}
                  required={form.includeMaterial}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Titulo da aula">
                  <input
                    className="admin-input"
                    value={form.materialLessonTitle}
                    onChange={(event) =>
                      setForm({ ...form, materialLessonTitle: event.target.value })
                    }
                    required={form.includeMaterial}
                  />
                </Field>
                <Field label="Duracao da aula">
                  <input
                    className="admin-input"
                    type="number"
                    min={1}
                    value={form.materialDurationMinutes}
                    onChange={(event) =>
                      setForm({ ...form, materialDurationMinutes: Number(event.target.value) })
                    }
                    required={form.includeMaterial}
                  />
                </Field>
              </div>
              <Field label="Descricao do material">
                <textarea
                  className="admin-input min-h-24"
                  value={form.materialDescription}
                  onChange={(event) =>
                    setForm({ ...form, materialDescription: event.target.value })
                  }
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Descricao da aula">
                  <input
                    className="admin-input"
                    value={form.materialLessonDescription}
                    onChange={(event) =>
                      setForm({ ...form, materialLessonDescription: event.target.value })
                    }
                  />
                </Field>
                <Field label="Thumbnail URL">
                  <input
                    className="admin-input"
                    value={form.materialThumbnailUrl}
                    onChange={(event) =>
                      setForm({ ...form, materialThumbnailUrl: event.target.value })
                    }
                  />
                </Field>
              </div>
              <label className="flex items-center gap-3 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={form.materialRequired}
                  onChange={(event) =>
                    setForm({ ...form, materialRequired: event.target.checked })
                  }
                />
                Aula obrigatoria
              </label>
            </>
          ) : null}
        </div>

        <div className="analytics-row space-y-5">
          <div className="flex items-center gap-3">
            <span className="analytics-activity-icon">
              <Play className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold text-white">Pratica imersiva</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Titulo do treinamento">
              <input
                className="admin-input"
                value={form.trainingTitle}
                onChange={(event) => setForm({ ...form, trainingTitle: event.target.value })}
                required
              />
            </Field>
            <Field label="Tipo de lancamento">
              <select
                className="admin-select"
                value={form.trainingLaunchType}
                onChange={(event) =>
                  setForm({ ...form, trainingLaunchType: event.target.value as LaunchType })
                }
              >
                <option value="web_url">Web / A-Frame</option>
                <option value="meta_app">App Meta</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="URL de lancamento">
              <input
                className="admin-input"
                value={form.trainingLaunchUrl}
                onChange={(event) => setForm({ ...form, trainingLaunchUrl: event.target.value })}
                placeholder="https://... ou immersia-meta://..."
              />
            </Field>
            <Field label="Minutos do treinamento">
              <input
                className="admin-input"
                type="number"
                min={1}
                value={form.trainingMinutes}
                onChange={(event) =>
                  setForm({ ...form, trainingMinutes: Number(event.target.value) })
                }
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Titulo da aula">
              <input
                className="admin-input"
                value={form.trainingLessonTitle}
                onChange={(event) =>
                  setForm({ ...form, trainingLessonTitle: event.target.value })
                }
                required
              />
            </Field>
            <Field label="Duracao da aula">
              <input
                className="admin-input"
                type="number"
                min={1}
                value={form.trainingDurationMinutes}
                onChange={(event) =>
                  setForm({ ...form, trainingDurationMinutes: Number(event.target.value) })
                }
                required
              />
            </Field>
          </div>

          <Field label="Descricao do treinamento">
            <textarea
              className="admin-input min-h-24"
              value={form.trainingDescription}
              onChange={(event) => setForm({ ...form, trainingDescription: event.target.value })}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Descricao da aula">
              <input
                className="admin-input"
                value={form.trainingLessonDescription}
                onChange={(event) =>
                  setForm({ ...form, trainingLessonDescription: event.target.value })
                }
              />
            </Field>
            <Field label="Imagem URL">
              <input
                className="admin-input"
                value={form.trainingImageUrl}
                onChange={(event) => setForm({ ...form, trainingImageUrl: event.target.value })}
              />
            </Field>
            <Field label="ID legado">
              <input
                className="admin-input"
                value={form.trainingLegacyId}
                onChange={(event) => setForm({ ...form, trainingLegacyId: event.target.value })}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-3 text-sm text-white/75">
              <input
                type="checkbox"
                checked={form.trainingEnabled}
                onChange={(event) => setForm({ ...form, trainingEnabled: event.target.checked })}
              />
              Disponivel para execucao
            </label>
            <label className="flex items-center gap-3 text-sm text-white/75">
              <input
                type="checkbox"
                checked={form.trainingRequired}
                onChange={(event) => setForm({ ...form, trainingRequired: event.target.checked })}
              />
              Aula obrigatoria
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="primary-btn sm:w-auto sm:px-6" disabled={isSubmitting}>
            <Plus className="h-4 w-4" />
            {isSubmitting ? 'Criando...' : 'Criar jornada'}
          </button>
        </div>
      </form>
    </section>
  );
}
