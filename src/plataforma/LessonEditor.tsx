import { Check, FileUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  errorText,
  post,
  uploadLessonFile,
  type Lesson,
  type QuizQuestion,
} from './api';
import { trainingNames } from './format';
import {
  kindMeta,
  newOption,
  newQuestion,
  quizProblems,
  type LessonKind,
} from './lessons';
import { Dialog, Field, Notice } from './ui';

// Nova etapa de um curso em rascunho (Immersia): texto, apostila, vídeo, imagem, link, quiz ou VR.

const KINDS: LessonKind[] = [
  'text',
  'pdf',
  'video',
  'quiz',
  'vr',
  'image',
  'link',
];
const PDF_MAX = 20 * 1024 * 1024;

function QuizEditor({
  questions,
  onChange,
}: {
  questions: QuizQuestion[];
  onChange: (q: QuizQuestion[]) => void;
}) {
  const set = (i: number, patch: Partial<QuizQuestion>) =>
    onChange(questions.map((q, n) => (n === i ? { ...q, ...patch } : q)));
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <fieldset
          key={q.id}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <legend className="text-sm font-semibold text-white">
              Pergunta {i + 1}
            </legend>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-white/60">
                <input
                  type="checkbox"
                  checked={Boolean(q.multiple)}
                  onChange={(e) =>
                    set(i, {
                      multiple: e.target.checked,
                      correct: e.target.checked
                        ? q.correct
                        : (q.correct ?? []).slice(0, 1),
                    })
                  }
                />
                Mais de uma certa
              </label>
              {questions.length > 1 ? (
                <button
                  type="button"
                  className="text-white/40 hover:text-rose-200"
                  aria-label={`Remover pergunta ${i + 1}`}
                  onClick={() => onChange(questions.filter((_, n) => n !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
          <textarea
            className="admin-input min-h-16"
            placeholder="Enunciado"
            value={q.text}
            onChange={(e) => set(i, { text: e.target.value })}
          />
          <p className="mb-1.5 mt-3 text-xs text-white/45">
            Alternativas · marque {q.multiple ? 'as certas' : 'a certa'}
          </p>
          <ul className="space-y-2">
            {q.options.map((o, k) => {
              const right = q.correct?.includes(o.id) ?? false;
              return (
                <li key={o.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    role={q.multiple ? 'checkbox' : 'radio'}
                    aria-checked={right}
                    aria-label={`Alternativa ${k + 1} é certa`}
                    onClick={() =>
                      set(i, {
                        correct: q.multiple
                          ? right
                            ? (q.correct ?? []).filter((c) => c !== o.id)
                            : [...(q.correct ?? []), o.id]
                          : [o.id],
                      })
                    }
                    className={`grid h-7 w-7 shrink-0 place-items-center border ${q.multiple ? 'rounded-lg' : 'rounded-full'} ${right ? 'border-emerald-300 bg-emerald-400/80 text-[#0b0918]' : 'border-white/25 text-transparent hover:border-white/50'}`}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <input
                    className="admin-input"
                    placeholder={`Alternativa ${k + 1}`}
                    value={o.text}
                    onChange={(e) =>
                      set(i, {
                        options: q.options.map((x) =>
                          x.id === o.id ? { ...x, text: e.target.value } : x
                        ),
                      })
                    }
                  />
                  {q.options.length > 2 ? (
                    <button
                      type="button"
                      className="text-white/40 hover:text-rose-200"
                      aria-label={`Remover alternativa ${k + 1}`}
                      onClick={() =>
                        set(i, {
                          options: q.options.filter((x) => x.id !== o.id),
                          correct: (q.correct ?? []).filter((c) => c !== o.id),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {q.options.length < 8 ? (
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-200 hover:text-white"
              onClick={() => set(i, { options: [...q.options, newOption()] })}
            >
              <Plus className="h-3.5 w-3.5" /> Alternativa
            </button>
          ) : null}
          <input
            className="admin-input mt-3"
            placeholder="Explicação mostrada depois da resposta (opcional)"
            value={q.explanation ?? ''}
            onChange={(e) => set(i, { explanation: e.target.value })}
          />
        </fieldset>
      ))}
      <button
        type="button"
        className="secondary-btn"
        onClick={() => onChange([...questions, newQuestion()])}
      >
        <Plus className="h-4 w-4" /> Pergunta
      </button>
    </div>
  );
}

export default function LessonEditor({
  open,
  courseId,
  position,
  onClose,
  onSaved,
}: {
  open: boolean;
  courseId: string;
  position: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState<LessonKind>('text');
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => [
    newQuestion(),
  ]);
  const [passing, setPassing] = useState('70');
  const [unityKey, setUnityKey] = useState(Object.keys(trainingNames)[0]);
  const [critical, setCritical] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setKind('text');
    setTitle('');
    setMinutes('');
    setBody('');
    setLink('');
    setFile(null);
    setQuestions([newQuestion()]);
    setPassing('70');
    setCritical('0');
    setError('');
  }

  const problems = [
    !title.trim() ? 'Dê um título à etapa.' : null,
    kind === 'text' && !body.trim() ? 'Escreva o texto da etapa.' : null,
    ['video', 'image', 'link'].includes(kind) &&
    !/^https?:\/\//.test(link.trim())
      ? 'Informe o endereço (https://…).'
      : null,
    kind === 'pdf' && !file && !/^https?:\/\//.test(link.trim())
      ? 'Envie o PDF da apostila ou informe o link.'
      : null,
    ...(kind === 'quiz' ? quizProblems(questions) : []),
  ].filter(Boolean) as string[];

  async function save() {
    if (problems.length) return setError(problems[0]);
    setSaving(true);
    setError('');
    const common = {
      position,
      title: title.trim(),
      content_version: '1.0.0',
      duration_minutes: minutes ? Number(minutes) : null,
    };
    const fields =
      kind === 'vr'
        ? {
            type: 'vr_training',
            unity_key: unityKey,
            min_app_version: '1.0.0',
            passing_score: Number(passing),
            max_critical_errors: Number(critical),
            body: body.trim() || null,
          }
        : kind === 'quiz'
          ? {
              type: 'quiz',
              passing_score: Number(passing),
              body: body.trim() || null,
              quiz: {
                questions: questions.map((q) => ({
                  id: q.id,
                  text: q.text.trim(),
                  multiple: Boolean(q.multiple),
                  options: q.options.map((o) => ({
                    id: o.id,
                    text: o.text.trim(),
                  })),
                  correct: q.correct,
                  explanation: q.explanation?.trim() || null,
                })),
              },
            }
          : {
              type: 'material',
              material_kind: kind,
              material_key:
                kind === 'text' || (kind === 'pdf' && file)
                  ? null
                  : link.trim(),
              body: body.trim() || null,
            };
    try {
      const created = await post<Lesson>(`/courses/${courseId}/lessons`, {
        ...common,
        ...fields,
      });
      if (kind === 'pdf' && file)
        await uploadLessonFile(courseId, created.id, file);
      reset();
      onSaved();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      wide={kind === 'quiz' || kind === 'text'}
      title={`Etapa ${position}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="primary-btn sm:w-auto sm:px-5"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? 'Salvando…' : 'Adicionar'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {KINDS.map((k) => {
          const meta = kindMeta[k];
          const active = k === kind;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={active}
              title={meta.hint}
              onClick={() => {
                setKind(k);
                setError('');
              }}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${active ? 'border-cyan-300/50 bg-cyan-400/10 text-white' : 'border-white/10 text-white/70 hover:border-white/25'}`}
            >
              <meta.icon className="h-4 w-4 shrink-0" />
              {meta.label}
            </button>
          );
        })}
      </div>
      <p className="-mt-1 text-xs text-white/45">{kindMeta[kind].hint}</p>

      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <Field label="Título">
          <input
            className="admin-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Duração (min)">
          <input
            className="admin-input"
            type="number"
            min={1}
            max={600}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </Field>
      </div>

      {kind === 'text' ? (
        <Field
          label="Texto"
          hint="# título · ## subtítulo · - lista · 1. passos · **negrito** · > destaque · [link](https://…)"
        >
          <textarea
            className="admin-input min-h-64 font-mono text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </Field>
      ) : null}

      {kind === 'pdf' ? (
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/20 px-4 py-4 text-sm text-white/70 hover:border-cyan-300/50">
            <FileUp className="h-5 w-5 text-cyan-200" />
            <span className="min-w-0 flex-1 truncate">
              {file ? file.name : 'Escolher o PDF da apostila (até 20 MB)'}
            </span>
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => {
                const chosen = e.target.files?.[0] ?? null;
                e.target.value = '';
                if (chosen && chosen.size > PDF_MAX)
                  return setError('O PDF passa de 20 MB.');
                if (chosen && chosen.type && chosen.type !== 'application/pdf')
                  return setError('Escolha um arquivo PDF.');
                setError('');
                setFile(chosen);
              }}
            />
          </label>
          {!file ? (
            <Field label="Ou o link do PDF">
              <input
                className="admin-input"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://"
              />
            </Field>
          ) : null}
        </div>
      ) : null}

      {['video', 'image', 'link'].includes(kind) ? (
        <Field
          label="Endereço"
          hint={
            kind === 'video'
              ? 'YouTube, Vimeo ou um arquivo .mp4 — o vídeo toca dentro da plataforma.'
              : undefined
          }
        >
          <input
            className="admin-input"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://"
          />
        </Field>
      ) : null}

      {kind === 'quiz' ? (
        <>
          <Field
            label="Nota mínima"
            hint="A etapa conclui quando o aluno atinge a nota. Tentativas ilimitadas."
          >
            <input
              className="admin-input sm:max-w-32"
              type="number"
              min={0}
              max={100}
              value={passing}
              onChange={(e) => setPassing(e.target.value)}
            />
          </Field>
          <QuizEditor questions={questions} onChange={setQuestions} />
        </>
      ) : null}

      {kind === 'vr' ? (
        <>
          <Field label="Treinamento">
            <select
              className="admin-select"
              value={unityKey}
              onChange={(e) => setUnityKey(e.target.value)}
            >
              {Object.entries(trainingNames).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nota mínima">
              <input
                className="admin-input"
                type="number"
                min={0}
                max={100}
                value={passing}
                onChange={(e) => setPassing(e.target.value)}
              />
            </Field>
            <Field label="Erros críticos tolerados">
              <input
                className="admin-input"
                type="number"
                min={0}
                value={critical}
                onChange={(e) => setCritical(e.target.value)}
              />
            </Field>
          </div>
        </>
      ) : null}

      {kind !== 'text' ? (
        <Field label="Observação para o aluno (opcional)">
          <input
            className="admin-input"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </Field>
      ) : null}

      {error ? <Notice tone="error">{error}</Notice> : null}
    </Dialog>
  );
}
