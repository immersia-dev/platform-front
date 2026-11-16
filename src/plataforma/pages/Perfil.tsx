import { useState, type FormEvent } from 'react';

import { useAuth } from '../../auth/useAuth';
import { api, errorText, post, roleNames, roleToBack } from '../api';
import { Card, Field, Notice, PageTitle } from '../ui';

/** Troca da própria senha (também no primeiro acesso, com senha provisória). */
export function PasswordForm({ onDone }: { onDone?: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [message, setMessage] = useState<{
    tone: 'error' | 'success';
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (next.length < 10)
      return setMessage({
        tone: 'error',
        text: 'A nova senha precisa de pelo menos 10 caracteres.',
      });
    if (next !== again)
      return setMessage({
        tone: 'error',
        text: 'As duas senhas novas não são iguais.',
      });
    setBusy(true);
    setMessage(null);
    try {
      await post('/auth/password', {
        current_password: current,
        new_password: next,
      });
      setCurrent('');
      setNext('');
      setAgain('');
      setMessage({ tone: 'success', text: 'Senha alterada.' });
      onDone?.();
    } catch (caught) {
      setMessage({ tone: 'error', text: errorText(caught) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Senha atual">
          <input
            className="admin-input"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        <Field label="Nova senha" hint="Mínimo de 10 caracteres.">
          <input
            className="admin-input"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>
        <Field label="Repita a nova senha">
          <input
            className="admin-input"
            type="password"
            autoComplete="new-password"
            value={again}
            onChange={(e) => setAgain(e.target.value)}
          />
        </Field>
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
        <button
          type="submit"
          className="primary-btn w-full"
          disabled={busy || !current || !next}
        >
          {busy ? 'Salvando…' : 'Trocar senha'}
        </button>
      </form>
    </Card>
  );
}

async function downloadMyData() {
  const data = await api<unknown>('/me/data');
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  );
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: 'meus-dados-immersia.json',
  });
  link.click();
  URL.revokeObjectURL(url);
}

export default function Perfil() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="max-w-md">
      <PageTitle
        title={user.name}
        subtitle={[
          roleNames[roleToBack[user.role]],
          user.organizationName,
          user.email,
        ]
          .filter(Boolean)
          .join(' · ')}
      />
      <h2 className="mb-3 text-sm font-medium text-white/70">Trocar senha</h2>
      <PasswordForm />
      <h2 className="mb-3 mt-8 text-sm font-medium text-white/70">
        Seus dados
      </h2>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="secondary-btn"
          onClick={() => void downloadMyData()}
        >
          Baixar meus dados
        </button>
        <a
          href={`${import.meta.env.BASE_URL}privacidade`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-cyan-200 hover:text-white"
        >
          Aviso de privacidade
        </a>
      </div>
    </div>
  );
}
