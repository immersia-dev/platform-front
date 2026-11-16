import { Eye, FileUp, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import {
  api,
  errorText,
  patch,
  post,
  remove,
  removeCover,
  uploadCover,
  uploadLessonFile,
  type Course,
  type Lesson,
} from '../api';
import { courseBody, courseForm, type CourseForm } from '../courses';
import LessonEditor from '../LessonEditor';
import { formatMinutesShort, kindMeta, lessonKind } from '../lessons';
import {
  courseCover,
  criterionText,
  formatHours,
  trainingNames,
  useLoad,
  validityText,
} from '../format';
import {
  Card,
  CourseState,
  Dialog,
  ErrorState,
  Field,
  Loading,
  Notice,
  PageTitle,
} from '../ui';

/** Campos do curso do catálogo (novo curso e edição). */
export function CourseFields({
  form,
  setForm,
}: {
  form: CourseForm;
  setForm: (form: CourseForm) => void;
}) {
  return (
    <>
      <Field label="Título">
        <input
          className="admin-input"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </Field>
      <Field
        label="Descrição"
        hint="Aparece no cartão do curso, na galeria do aluno."
      >
        <textarea
          className="admin-input min-h-20"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Carga horária (h)">
          <input
            className="admin-input"
            inputMode="decimal"
            value={form.workload_hours}
            onChange={(e) =>
              setForm({ ...form, workload_hours: e.target.value })
            }
          />
        </Field>
        <Field label="Validade (meses)" hint="Vazio: não vence.">
          <input
            className="admin-input"
            type="number"
            min={1}
            value={form.validity_months}
            onChange={(e) =>
              setForm({ ...form, validity_months: e.target.value })
            }
          />
        </Field>
      </div>
      <Field label="Conteúdo programático">
        <textarea
          className="admin-input min-h-24"
          value={form.syllabus}
          onChange={(e) => setForm({ ...form, syllabus: e.target.value })}
        />
      </Field>
      <Field
        label="Responsável técnico"
        hint="Nome e qualificação, como sai no certificado."
      >
        <input
          className="admin-input"
          value={form.technical_lead}
          onChange={(e) => setForm({ ...form, technical_lead: e.target.value })}
        />
      </Field>
    </>
  );
}

/** Uma etapa na lista do catálogo: tipo, detalhes, pré-visualização e apostila. */
function LessonRow({
  lesson: l,
  courseId,
  draft,
  onChange,
  onRemove,
}: {
  lesson: Lesson;
  courseId: string;
  draft: boolean;
  onChange: () => void;
  onRemove: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const kind = lessonKind(l);
  const meta = kindMeta[kind];
  const minutes = formatMinutesShort(l.duration_minutes);
  const detail =
    kind === 'vr'
      ? `${trainingNames[l.unity_key ?? ''] ?? l.unity_key} · ${criterionText(l.passing_score, l.max_critical_errors)}`
      : kind === 'quiz'
        ? `${l.quiz?.questions.length ?? 0} pergunta${l.quiz?.questions.length === 1 ? '' : 's'} · mínimo ${Number(l.passing_score ?? 0)}`
        : kind === 'text'
          ? `${(l.body ?? '').split(/\s+/).filter(Boolean).length} palavras`
          : kind === 'pdf'
            ? (l.file_name ?? l.material_key ?? 'Sem arquivo')
            : (l.material_key ?? '');

  async function upload(file: File | undefined) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return setError('O PDF passa de 20 MB.');
    setBusy(true);
    setError('');
    try {
      await uploadLessonFile(courseId, l.id, file);
      onChange();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <span className="w-5 text-xs tabular-nums text-white/35">
        {l.position}
      </span>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04]">
        <meta.icon className="h-4 w-4 text-white/60" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{l.title}</p>
        <p
          className={`truncate text-xs ${kind === 'pdf' && !l.file_name && !l.material_key ? 'text-amber-200/90' : 'text-white/45'}`}
        >
          {meta.label} · {detail}
          {minutes ? ` · ${minutes}` : ''}
        </p>
        {error ? <p className="mt-1 text-xs text-rose-200">{error}</p> : null}
      </div>
      <div className="flex items-center gap-3 pl-8 sm:pl-0">
        {draft && kind === 'pdf' ? (
          <label
            className={`p-action p-action-accent ${busy ? 'pointer-events-none opacity-60' : ''}`}
          >
            <FileUp className="h-3.5 w-3.5" />{' '}
            {busy ? 'Enviando…' : l.file_name ? 'Trocar PDF' : 'Enviar PDF'}
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
        ) : null}
        <Link
          to={`/app/cursos/${courseId}/etapas/${l.id}`}
          className="p-action p-action-accent"
        >
          <Eye className="h-3.5 w-3.5" /> Ver como aluno
        </Link>
        {draft ? (
          <button
            type="button"
            className="p-action p-action-danger"
            onClick={onRemove}
          >
            Remover
          </button>
        ) : null}
      </div>
    </li>
  );
}

const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const COVER_MAX_BYTES = 3 * 1024 * 1024;

/** Faixa com a foto de capa do curso; a Immersia envia, troca ou remove. */
function CoverEditor({
  course,
  editable,
  onChange,
}: {
  course: Course;
  editable: boolean;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const src = courseCover(course.cover_url);

  async function send(file: File | undefined) {
    if (!file) return;
    setError('');
    if (!COVER_TYPES.includes(file.type))
      return setError('Use uma imagem JPG, PNG ou WebP.');
    if (file.size > COVER_MAX_BYTES)
      return setError(
        'A imagem passa de 3 MB. Reduza o tamanho e envie de novo.'
      );
    setBusy(true);
    try {
      await uploadCover(course.id, file);
      onChange();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  async function drop() {
    setBusy(true);
    setError('');
    try {
      await removeCover(course.id);
      onChange();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  if (!src && !editable) return null;
  return (
    <section className="mb-5">
      <div className="relative overflow-hidden rounded-3xl border border-white/10">
        {src ? (
          <img
            src={src}
            alt={`Capa de ${course.title}`}
            className="h-48 w-full object-cover sm:h-56"
          />
        ) : (
          <div className="grid h-48 w-full place-items-center bg-gradient-to-br from-cyan-500/20 via-violet-600/20 to-fuchsia-600/15 sm:h-56">
            <div className="text-center">
              <ImagePlus className="mx-auto h-10 w-10 text-white/45" />
              <p className="mt-2 text-sm text-white/60">Sem foto de capa</p>
              <p className="text-xs text-white/40">
                Aparece na galeria do aluno e nos treinamentos VR.
              </p>
            </div>
          </div>
        )}
        {editable ? (
          <div className="absolute bottom-3 right-3 flex gap-2">
            <label
              className={`primary-btn cursor-pointer sm:w-auto sm:px-4 ${busy ? 'pointer-events-none opacity-60' : ''}`}
            >
              <ImagePlus className="h-4 w-4" />
              {busy ? 'Enviando…' : src ? 'Trocar capa' : 'Enviar capa'}
              <input
                type="file"
                accept={COVER_TYPES.join(',')}
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  void send(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            {src ? (
              <button
                type="button"
                className="secondary-btn bg-black/50 backdrop-blur"
                disabled={busy}
                onClick={() => void drop()}
              >
                <Trash2 className="h-4 w-4" /> Remover
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {editable ? (
        <p className="mt-2 text-xs text-white/40">
          JPG, PNG ou WebP até 3 MB. Horizontal, de preferência 1280 × 720 ou
          maior.
        </p>
      ) : null}
      {error ? (
        <div className="mt-2">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}
    </section>
  );
}

export default function CursoDetalhe() {
  const { courseId = '' } = useParams();
  const { user } = useAuth();
  const isSuper = user?.role === 'super_admin';
  const data = useLoad(async () => {
    const [course, lessons] = await Promise.all([
      api<Course>(`/courses/${courseId}`),
      api<Lesson[]>(`/courses/${courseId}/lessons`),
    ]);
    return { course, lessons };
  }, [courseId]);
  const [modal, setModal] = useState<null | 'lesson' | 'edit' | 'publish'>(
    null
  );
  const [form, setForm] = useState<CourseForm | null>(null);
  const [error, setError] = useState('');

  if (data.loading) return <Loading />;
  if (data.error || !data.data)
    return <ErrorState message={data.error || 'Curso não encontrado.'} />;
  const { course, lessons } = data.data;
  const draft = isSuper && !course.published_at && !course.archived_at;

  async function run(action: () => Promise<unknown>) {
    setError('');
    try {
      await action();
      setModal(null);
      void data.reload(true);
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  const cancel = (
    <button
      type="button"
      className="secondary-btn"
      onClick={() => setModal(null)}
    >
      Cancelar
    </button>
  );

  return (
    <>
      <PageTitle
        back="/app/cursos"
        title={course.title}
        subtitle={[formatHours(course.workload_hours), validityText(course)]
          .filter((t) => t !== '—')
          .join(' · ')}
        actions={
          isSuper ? (
            <>
              <CourseState course={course} />
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setError('');
                  setForm(courseForm(course));
                  setModal('edit');
                }}
              >
                Editar
              </button>
              {draft ? (
                <button
                  type="button"
                  className="primary-btn sm:w-auto sm:px-5"
                  disabled={!lessons.length}
                  onClick={() => setModal('publish')}
                >
                  Publicar
                </button>
              ) : null}
            </>
          ) : null
        }
      />

      <CoverEditor
        course={course}
        editable={isSuper}
        onChange={() => void data.reload(true)}
      />

      {course.description ? (
        <p className="mb-5 max-w-3xl text-sm text-white/65">
          {course.description}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card
          title="Etapas"
          action={
            draft ? (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setError('');
                  setModal('lesson');
                }}
              >
                <Plus className="h-4 w-4" /> Etapa
              </button>
            ) : null
          }
        >
          {lessons.length ? (
            <ol className="-my-2 divide-y divide-white/[0.06]">
              {lessons.map((l) => (
                <LessonRow
                  key={l.id}
                  lesson={l}
                  courseId={courseId}
                  draft={draft}
                  onChange={() => void data.reload(true)}
                  onRemove={() =>
                    void run(() =>
                      remove(`/courses/${courseId}/lessons/${l.id}`)
                    )
                  }
                />
              ))}
            </ol>
          ) : (
            <p className="text-sm text-white/50">Nenhuma etapa ainda.</p>
          )}
        </Card>

        <Card title="No certificado">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-white/45">Conteúdo programático</dt>
              <dd className="mt-0.5 whitespace-pre-line text-white/80">
                {course.syllabus || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-white/45">Responsável técnico</dt>
              <dd className="mt-0.5 text-white/80">
                {course.technical_lead || '—'}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
      {error && !modal ? (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}

      <Dialog
        open={modal === 'edit'}
        title="Editar curso"
        onClose={() => setModal(null)}
        footer={
          <>
            {cancel}
            <button
              type="button"
              className="primary-btn sm:w-auto sm:px-5"
              disabled={!form?.title.trim()}
              onClick={() =>
                form &&
                void run(() => patch(`/courses/${courseId}`, courseBody(form)))
              }
            >
              Salvar
            </button>
          </>
        }
      >
        {form ? <CourseFields form={form} setForm={setForm} /> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>

      <LessonEditor
        open={modal === 'lesson'}
        courseId={courseId}
        position={lessons.length + 1}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null);
          void data.reload(true);
        }}
      />

      <Dialog
        open={modal === 'publish'}
        title="Publicar o curso?"
        onClose={() => setModal(null)}
        footer={
          <>
            {cancel}
            <button
              type="button"
              className="primary-btn sm:w-auto sm:px-5"
              onClick={() =>
                void run(() => post(`/courses/${courseId}/publish`))
              }
            >
              Publicar
            </button>
          </>
        }
      >
        <p className="text-sm text-white/65">
          Depois de publicado, as etapas não mudam (os dados do certificado
          continuam editáveis). Para liberar o curso a uma organização, abra a
          organização.
        </p>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>
    </>
  );
}
