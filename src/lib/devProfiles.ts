import { isDemoMode } from './demoMode';

export function areDevProfilesEnabled() {
  return (
    import.meta.env.DEV || isDemoMode || import.meta.env.VITE_ENABLE_DEV_PROFILES === 'true'
  );
}
