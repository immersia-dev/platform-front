import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { type AppRole } from '../data/mockPlatform';
import { loginWithApi, type ApiSessionUser } from '../lib/apiClient';
import { setUnauthorizedHandler } from '../plataforma/api';

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  organizationId: string | null;
  organizationName: string | null;
};

type SignInPayload = {
  login: string;
  password: string;
};

type AuthContextValue = {
  user: SessionUser | null;
  accessToken: string | null;
  signIn: (payload: SignInPayload) => Promise<SessionUser | null>;
  signOut: () => void;
  updateSessionUser: (userRecord: ApiSessionUser) => void;
};

type StoredSession = {
  user: SessionUser;
  accessToken: string;
};

const STORAGE_KEY = 'platform-safety.api-session';

const AuthContext = createContext<AuthContextValue | null>(null);

function buildSessionUser(userRecord: ApiSessionUser): SessionUser {
  return {
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    role: userRecord.role,
    organizationId: userRecord.organization_id,
    organizationName: userRecord.organization_name,
  };
}

function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  if (!storedValue) return null;

  try {
    return JSON.parse(storedValue) as StoredSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<StoredSession | null>(() => readStoredSession());
  const user = session?.user ?? null;
  const accessToken = session?.accessToken ?? null;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  const signIn = useCallback(async (payload: SignInPayload) => {
    const response = await loginWithApi(payload.login.trim().toLowerCase(), payload.password);
    const nextUser = buildSessionUser(response.user);
    setSession({
      user: nextUser,
      accessToken: response.access_token,
    });
    return nextUser;
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
  }, []);

  // token expirado ou revogado: volta para o login em vez de deixar as telas falhando
  useEffect(() => {
    setUnauthorizedHandler(() => setSession(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const updateSessionUser = useCallback((userRecord: ApiSessionUser) => {
    setSession((current) =>
      current
        ? {
            ...current,
            user: buildSessionUser(userRecord),
          }
        : current
    );
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      signIn,
      signOut,
      updateSessionUser,
    }),
    [accessToken, signIn, signOut, updateSessionUser, user]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export { AuthContext };
