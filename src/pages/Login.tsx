import { useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';

import logoUrl from '../assets/Immersia_logo-removebg.png';

export default function Login() {
  const navigate = useNavigate();

  const loginId = useId();
  const passId = useId();
  const errorId = useId();

  // padrão indústria: não preenche nada; aceita email ou username
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const [touched, setTouched] = useState({
    login: false,
    password: false,
  });

  const loginError = useMemo(() => {
    if (!touched.login) return '';
    if (login.trim().length === 0) return 'Informe seu usuário ou e-mail.';
    return '';
  }, [login, touched.login]);

  const passwordError = useMemo(() => {
    if (!touched.password) return '';
    if (password.trim().length < 6) return 'Senha inválida.';
    return '';
  }, [password, touched.password]);

  const canSubmit = login.trim().length > 0 && password.trim().length >= 6;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setTouched({ login: true, password: true });

    if (!canSubmit) return;

    // sem integração por enquanto
    navigate('/gallery');
  }

  return (
    <main className="immersia-bg min-h-screen text-white antialiased">
      <div className="min-h-screen bg-black/10">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
          <section className="glass-card" aria-label="Tela de login">
            <header className="mb-10 text-center">
              <div className="mx-auto mb-6 flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="Immersia"
                  className="h-16 w-auto sm:h-20 md:h-24 select-none"
                  draggable={false}
                />
              </div>
            </header>

            {/* VR: mais espaçamento e controles maiores */}
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              {/* Login */}
              <div>
                <label htmlFor={loginId} className="sr-only">
                  Usuário ou e-mail
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center">
                    <User className="h-5 w-5 text-white/60" />
                  </div>

                  <input
                    id={loginId}
                    name="login"
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    onBlur={() => setTouched((s) => ({ ...s, login: true }))}
                    placeholder="Usuário ou e-mail"
                    aria-invalid={loginError ? 'true' : 'false'}
                    className={[
                      'pill-input py-4 pl-14 pr-5 text-base',
                      loginError
                        ? 'border-rose-300/40 focus:border-rose-300'
                        : '',
                    ].join(' ')}
                  />
                </div>

                <div className="pt-2 min-h-[22px]">
                  <p
                    className={[
                      'text-base text-rose-300 transition-opacity duration-150',
                      loginError ? 'opacity-100' : 'opacity-0',
                    ].join(' ')}
                    aria-live="polite"
                  >
                    {loginError || ' '}
                  </p>
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor={passId} className="sr-only">
                  Senha
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center">
                    <Lock className="h-5 w-5 text-white/60" />
                  </div>

                  <input
                    id={passId}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    minLength={6}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((s) => ({ ...s, password: true }))}
                    placeholder="Senha"
                    aria-invalid={passwordError ? 'true' : 'false'}
                    aria-describedby={passwordError ? errorId : undefined}
                    className={[
                      'pill-input py-4 pl-14 pr-5 text-base',
                      passwordError
                        ? 'border-rose-300/40 focus:border-rose-300'
                        : '',
                    ].join(' ')}
                  />
                </div>

                <div className="pt-2 min-h-[22px]">
                  <p
                    id={errorId}
                    className={[
                      'text-base text-rose-300 transition-opacity duration-150',
                      passwordError ? 'opacity-100' : 'opacity-0',
                    ].join(' ')}
                    aria-live="polite"
                  >
                    {passwordError || ' '}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between gap-4 text-base text-white/75">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-white/30 bg-white/10"
                  />
                  Lembrar de mim
                </label>

                <button
                  type="button"
                  className="hover:text-white underline underline-offset-4"
                >
                  Esqueci a senha
                </button>
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="primary-btn py-4 text-base mt-4"
              >
                Entrar
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
