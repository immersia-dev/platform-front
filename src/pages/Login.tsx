import { useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const loginId = useId();
  const passId = useId();
  const errorId = useId();

  // padrão indústria: não preenche nada; aceita email ou username
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const [touched, setTouched] = useState({
    login: false,
    password: false,
  });

  const loginError = useMemo(() => {
    if (!touched.login) return "";
    if (login.trim().length === 0) return "Informe seu usuário ou e-mail.";
    return "";
  }, [login, touched.login]);

  const passwordError = useMemo(() => {
    if (!touched.password) return "";
    if (password.trim().length < 6) return "Senha inválida.";
    return "";
  }, [password, touched.password]);

  const canSubmit = login.trim().length > 0 && password.trim().length >= 6;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setTouched({ login: true, password: true });

    if (!canSubmit) return;

    // sem integração por enquanto
    navigate("/gallery");
  }

  return (
    <main className="immersia-bg min-h-screen text-white antialiased">
      <div className="min-h-screen bg-black/10">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
          <section className="glass-card" aria-label="Tela de login">
            <header className="mb-10 text-center">
              {/* Troque pelo arquivo real da sua logo depois (ex.: /public/logo.svg) */}
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                {/* Exemplo com IMG (quando você tiver a logo) */}
                {/* <img src="/logo.svg" alt="Immersia" className="h-10 w-10" /> */}

                {/* Placeholder atual */}
                <span className="text-xl font-bold">I</span>
              </div>

              <h1 className="text-4xl font-semibold tracking-tight">Login</h1>
            </header>

            {/* VR: mais espaçamento e controles maiores */}
            <form onSubmit={onSubmit} noValidate className="space-y-6">
              {/* Login */}
              <div className="relative">
                <label htmlFor={loginId} className="sr-only">
                  Usuário ou e-mail
                </label>

                <User className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" />

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
                  aria-invalid={loginError ? "true" : "false"}
                  className="pill-input py-4 pl-14 pr-5 text-base"
                />

                {loginError ? (
                  <p className="mt-3 text-base text-rose-300">{loginError}</p>
                ) : null}
              </div>

              {/* Password */}
              <div className="relative">
                <label htmlFor={passId} className="sr-only">
                  Senha
                </label>

                <Lock className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" />

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
                  aria-invalid={passwordError ? "true" : "false"}
                  aria-describedby={passwordError ? errorId : undefined}
                  className="pill-input py-4 pl-14 pr-5 text-base"
                />

                {passwordError ? (
                  <p id={errorId} className="mt-3 text-base text-rose-300">
                    {passwordError}
                  </p>
                ) : null}
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
                className="primary-btn py-4 text-base"
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
