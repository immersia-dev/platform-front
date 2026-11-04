import { useEffect, useState } from 'react';

const ROUTE_DATA_SKELETON_DELAY_MS = 260;

export function useRouteDataSkeleton(pathname: string) {
  const [settledPathname, setSettledPathname] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSettledPathname(pathname);
    }, ROUTE_DATA_SKELETON_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  return settledPathname !== pathname;
}
