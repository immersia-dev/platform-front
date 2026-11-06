import type { AppRole } from '../data/mockPlatform';

import { isDemoMode } from '../lib/demoMode';

export function getDefaultAppPath(role: AppRole) {
  if (!isDemoMode)
    return {
      super_admin: '/app/painel',
      org_admin: '/app/painel',
      instructor: '/app/painel',
      learner: '/app/meus-cursos',
    }[role];

  if (role === 'super_admin' || role === 'org_admin' || role === 'instructor') {
    return '/app/overview';
  }

  return '/app/studies';
}
