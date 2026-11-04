import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuth } from '../auth/useAuth';
import { fetchPlatformSnapshot, getApiErrorMessage } from '../lib/apiClient';
import { applyPlatformSnapshot, type PlatformSnapshot } from './platformSnapshot';

type PlatformDataContextValue = {
  isLoading: boolean;
  error: string;
  version: number;
  refresh: () => Promise<void>;
};

const PlatformDataContext = createContext<PlatformDataContextValue | null>(null);

export function PlatformDataProvider({ children }: PropsWithChildren) {
  const { accessToken, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    if (!accessToken || !user) {
      setError('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const snapshot = await fetchPlatformSnapshot<PlatformSnapshot>(accessToken);
      applyPlatformSnapshot(snapshot);
      setVersion((current) => current + 1);
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, 'Não foi possível carregar dados.'));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      isLoading: isLoading || Boolean(accessToken && user && version === 0 && !error),
      error,
      refresh,
      version,
    }),
    [accessToken, error, isLoading, refresh, user, version]
  );

  return <PlatformDataContext.Provider value={value}>{children}</PlatformDataContext.Provider>;
}

export function usePlatformData() {
  const context = useContext(PlatformDataContext);

  if (!context) {
    throw new Error('usePlatformData must be used within PlatformDataProvider');
  }

  return context;
}
