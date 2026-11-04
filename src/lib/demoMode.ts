/**
 * Modo demonstracao: a aplicacao roda inteira no browser, sem backend.
 *
 * Ligado explicitamente por `VITE_DEMO_MODE=true` ou, por padrao, sempre que
 * nenhuma URL de API for configurada em build (caso da vitrine publicada junto
 * ao website institucional).
 */
const explicitFlag = import.meta.env.VITE_DEMO_MODE;

export const isDemoMode =
  explicitFlag === 'true' || (explicitFlag !== 'false' && !import.meta.env.VITE_API_URL);

/** Senha aceita por qualquer perfil quando a plataforma roda em modo demo. */
export const DEMO_PASSWORD = '123456789';

const TOKEN_PREFIX = 'demo-session:';

export function buildDemoToken(userId: string) {
  return `${TOKEN_PREFIX}${userId}`;
}

export function readDemoTokenUserId(token: string | null | undefined) {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;

  return token.slice(TOKEN_PREFIX.length) || null;
}
