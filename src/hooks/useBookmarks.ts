import { useState, useEffect, useCallback } from 'react';
import { BookmarkService } from '../services/BookmarkService';

export function useBookmark(questionId: number) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    BookmarkService.isBookmarked(questionId).then(setIsBookmarked);
  }, [questionId]);

  const toggle = useCallback(async () => {
    const result = await BookmarkService.toggle(questionId);
    setIsBookmarked(result);
  }, [questionId]);

  return { isBookmarked, toggle };
}

export function useBookmarkedIds() {
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await BookmarkService.getBookmarkedQuestionIds();
    setIds(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ids, loading, refresh };
}
