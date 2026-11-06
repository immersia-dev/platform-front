import { isDemoMode } from './demoMode';

/**
 * Atalhos de perfil (só desenvolvimento): no Vite de desenvolvimento, no modo demonstração ou num build feito com
 * VITE_ENABLE_DEV_PROFILES=true (o compose de desenvolvimento liga). Um build de produção comum não os mostra.
 */
export function areDevProfilesEnabled() {
  return (
    import.meta.env.DEV ||
    isDemoMode ||
    import.meta.env.VITE_ENABLE_DEV_PROFILES === 'true'
  );
}

/** Perfis que /dev/:slug abre direto, com as contas do seed demo. */
export const devProfileLinks = [
  { slug: 'super-admin', label: 'Immersia' },
  { slug: 'org-admin', label: 'Gestor' },
  { slug: 'instructor', label: 'Instrutor' },
  { slug: 'learner', label: 'Aluno' },
] as const;
