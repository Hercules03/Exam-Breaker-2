import { useState, useEffect, useCallback } from 'react';
import { FlagService } from '../services/FlagService';

export function useFlag(questionId: number, context: string) {
  const [isFlagged, setIsFlagged] = useState(false);

  useEffect(() => {
    FlagService.isFlagged(questionId, context).then(setIsFlagged);
  }, [questionId, context]);

  const toggle = useCallback(async () => {
    const newState = await FlagService.toggleFlag(questionId, context);
    setIsFlagged(newState);
    return newState;
  }, [questionId, context]);

  return { isFlagged, toggle };
}

export function useFlaggedIds(context: string) {
  const [ids, setIds] = useState<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    const flagged = await FlagService.getFlaggedIds(context);
    setIds(flagged);
  }, [context]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ids, refresh };
}
