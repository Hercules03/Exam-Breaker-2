import { useState, useEffect, useCallback } from 'react';
import { StudyActivityService } from '../services/StudyActivityService';

export function useStudyActivity() {
  const [streak, setStreak] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [dailyGoal, setDailyGoalState] = useState(20);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [streakVal, today] = await Promise.all([
      StudyActivityService.getStreak(),
      StudyActivityService.getToday(),
    ]);
    setStreak(streakVal);
    setTodayCount(today?.questionsStudied || 0);
    setDailyGoalState(StudyActivityService.getDailyGoal());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setDailyGoal = useCallback((target: number) => {
    StudyActivityService.setDailyGoal(target);
    setDailyGoalState(target);
  }, []);

  return { streak, todayCount, dailyGoal, loading, setDailyGoal, refresh };
}
