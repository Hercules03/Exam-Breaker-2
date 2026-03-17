import { useState, useEffect } from 'react';
import { DomainStats, OverallStats } from '../types/index';
import { ProgressService } from '../services/ProgressService';

export function useDomainStats(domain: string) {
  const [stats, setStats] = useState<DomainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ProgressService.getDomainStats(domain);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load domain stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [domain]);

  const refresh = async () => {
    try {
      const data = await ProgressService.getDomainStats(domain);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh domain stats');
    }
  };

  return { stats, loading, error, refresh };
}

export function useAllDomainStats() {
  const [stats, setStats] = useState<DomainStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ProgressService.getAllDomainStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load domain stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const refresh = async () => {
    try {
      const data = await ProgressService.getAllDomainStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh domain stats');
    }
  };

  return { stats, loading, error, refresh };
}

export function useOverallStats() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ProgressService.getOverallStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load overall stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const refresh = async () => {
    try {
      const data = await ProgressService.getOverallStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh overall stats');
    }
  };

  return { stats, loading, error, refresh };
}
