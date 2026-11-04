import { useEffect, useState } from 'react';

import { useAuth } from '../auth/useAuth';
import { usePlatformData } from '../data/PlatformDataContext';
import {
  lessonProgressSeed,
  type LessonProgressRecord,
  type LessonProgressStatus,
} from '../data/mockPlatform';
import { getApiErrorMessage, updateLessonProgress } from '../lib/apiClient';

export function useLessonProgress() {
  const { accessToken } = useAuth();
  const platformData = usePlatformData();
  const [progressRecords, setProgressRecords] = useState<LessonProgressRecord[]>(() => [
    ...lessonProgressSeed,
  ]);
  const [progressError, setProgressError] = useState('');

  useEffect(() => {
    setProgressRecords([...lessonProgressSeed]);
  }, [platformData.version]);

  function setLessonStatus(learnerId: string, lessonId: string, status: LessonProgressStatus) {
    const now = new Date().toISOString();
    const previousProgressRecords = progressRecords;
    setProgressError('');

    setProgressRecords((current) => {
      const existingRecord = current.find(
        (record) => record.learnerId === learnerId && record.lessonId === lessonId
      );

      if (!existingRecord) {
        return [
          ...current,
          {
            id: `progress-${learnerId}-${lessonId}`,
            learnerId,
            lessonId,
            status,
            startedAt: status === 'not_started' ? null : now,
            completedAt: status === 'completed' ? now : null,
          },
        ];
      }

      return current.map((record) =>
        record.id === existingRecord.id
          ? {
              ...record,
              status,
              startedAt: record.startedAt ?? (status === 'not_started' ? null : now),
              completedAt: status === 'completed' ? now : null,
            }
          : record
      );
    });

    if (!accessToken) {
      setProgressRecords(previousProgressRecords);
      setProgressError('Sua sessão expirou. Entre novamente.');
      return;
    }

    void updateLessonProgress<LessonProgressRecord>(accessToken, lessonId, status)
      .then(() => platformData.refresh())
      .catch((error) => {
        setProgressRecords(previousProgressRecords);
        setProgressError(getApiErrorMessage(error, 'Não foi possível atualizar o progresso.'));
      });
  }

  return {
    progressRecords,
    progressError,
    setLessonStatus,
  };
}
