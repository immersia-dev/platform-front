import { Plus } from 'lucide-react';
import { useState } from 'react';

import { api, errorText, patch, post, type Quest } from '../api';
import { formatCode, formatDateTime, useLoad } from '../format';
import {
  Card,
  Dialog,
  Empty,
  ErrorState,
  Field,
  Loading,
  Notice,
  PageTitle,
} from '../ui';

type Edit = { id?: string; code: string; name: string };

function QuestState({ quest }: { quest: Quest }) {
  if (quest.busy)
    return (
      <span className="status-pill border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
        Em uso
      </span>
    );
  if (quest.busy === false)
    return <span className="status-pill status-pill-success">Livre</span>;
  return <span className="text-white/40">—</span>;
}

/** Quests da organização: vínculo pela configuração inicial do óculos, nome e desvínculo. Gestor e instrutor. */
export default function Quests() {
  const data = useLoad(() => api<Quest[]>('/quests'), []);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [resetting, setResetting] = useState<Quest | null>(null);
  const [error, setError] = useState('');

  async function run(action: () => Promise<unknown>) {
    setError('');
    try {
      await action();
      setEdit(null);
      setResetting(null);
      void data.reload(true);
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  const save = () =>
    edit &&
    run(() =>
      edit.id
        ? patch(`/quests/${edit.id}`, { name: edit.name })
        : post('/quests', { code: edit.code, name: edit.name })
    );

  if (data.loading) return <Loading />;
  if (data.error || !data.data)
    return (
      <ErrorState message={data.error} onRetry={() => void data.reload()} />
    );
  const quests = data.data;

  return (
    <>
      <PageTitle
        title="Quests"
        actions={
          <button
            type="button"
            className="primary-btn sm:w-auto sm:px-5"
            onClick={() => {
              setError('');
              setEdit({
                code: '',
                name: `Quest ${String(quests.length + 1).padStart(2, '0')}`,
              });
            }}
          >
            <Plus className="h-4 w-4" /> Vincular Quest
          </button>
        }
      />

      <Card flush>
        {!quests.length ? (
          <Empty title="Nenhum Quest vinculado">
            Ligue o Quest e abra a Immersia: na configuração inicial ele mostra
            um código. Digite-o em Vincular Quest.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="p-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Situação</th>
                  <th>App</th>
                  <th>Última sessão</th>
                  <th>Sessões</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {quests.map((q) => (
                  <tr key={q.id}>
                    <td className="font-medium text-white">{q.name}</td>
                    <td>
                      <QuestState quest={q} />
                    </td>
                    <td className="text-white/60">{q.app_version ?? '—'}</td>
                    <td className="whitespace-nowrap text-white/55">
                      {formatDateTime(q.last_used_at)}
                    </td>
                    <td className="tabular-nums">{q.sessions}</td>
                    <td className="whitespace-nowrap text-right">
                      <button
                        type="button"
                        className="mr-2 p-action"
                        onClick={() => {
                          setError('');
                          setEdit({ id: q.id, code: '', name: q.name ?? '' });
                        }}
                      >
                        Renomear
                      </button>
                      <button
                        type="button"
                        className="p-action p-action-danger"
                        onClick={() => {
                          setError('');
                          setResetting(q);
                        }}
                      >
                        Desvincular
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 text-xs text-white/40">
        O código de treinamento de um Quest vinculado só funciona nesta
        organização. No próprio óculos, Configurações › Desvincular também tira
        o Quest daqui.
      </p>

      <Dialog
        open={Boolean(edit)}
        title={edit?.id ? 'Renomear Quest' : 'Vincular Quest'}
        onClose={() => setEdit(null)}
        footer={
          <>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setEdit(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="primary-btn sm:w-auto sm:px-5"
              disabled={
                !edit?.name.trim() ||
                (!edit?.id && (edit?.code.replace('-', '').length ?? 0) < 6)
              }
              onClick={() => void save()}
            >
              {edit?.id ? 'Salvar' : 'Vincular'}
            </button>
          </>
        }
      >
        {edit && !edit.id ? (
          <Field
            label="Código da configuração inicial"
            hint="Aparece no Quest ainda não vinculado, em “Vincule este Quest à sua organização”."
          >
            <input
              className="p-code text-2xl sm:text-3xl"
              value={edit.code}
              onChange={(e) =>
                setEdit({ ...edit, code: formatCode(e.target.value) })
              }
              placeholder="K7Q-4M2"
              autoFocus
            />
          </Field>
        ) : null}
        {edit ? (
          <Field label="Nome" hint="Aparece no painel do Quest.">
            <input
              className="admin-input"
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              placeholder="Ex.: Quest 03 · sala de treinamento"
            />
          </Field>
        ) : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>

      <Dialog
        open={Boolean(resetting)}
        title="Desvincular este Quest?"
        onClose={() => setResetting(null)}
        footer={
          <>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setResetting(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="danger-btn"
              onClick={() =>
                resetting &&
                void run(() => post(`/quests/${resetting.id}/reset`))
              }
            >
              Desvincular
            </button>
          </>
        }
      >
        <p className="text-sm text-white/65">
          {resetting?.name} volta para a configuração inicial e deixa de aceitar
          treinamentos da organização. O histórico de sessões fica guardado.
        </p>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>
      {error && !edit && !resetting ? (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}
    </>
  );
}
