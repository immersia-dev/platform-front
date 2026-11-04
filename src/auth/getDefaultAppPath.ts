import type { AppRole } from '../data/mockPlatform';

export function getDefaultAppPath(role: AppRole) {
  if (role === 'super_admin' || role === 'org_admin' || role === 'instructor') {
    return '/app/overview';
  }

  return '/app/studies';
}
