import { Navigate } from 'react-router-dom';
import type { PropsWithChildren } from 'react';

import { getDefaultAppPath } from './getDefaultAppPath';
import { useAuth } from './useAuth';
import type { AppRole } from '../data/mockPlatform';

export function RequireAuth({ children }: PropsWithChildren) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

type RequireRolesProps = PropsWithChildren<{
  roles: AppRole[];
}>;

export function RequireRoles({ roles, children }: RequireRolesProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={getDefaultAppPath(user.role)} replace />;
  }

  return children;
}

export function RoleHomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={getDefaultAppPath(user.role)} replace />;
}
