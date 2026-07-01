import { useCallback, useEffect, useState } from 'react';

interface BadgeCounts {
  verifications: number;
  reports: number;
}

/**
 * Fetches pending badge counts from the backend and keeps them
 * refreshed at a configurable interval (default 30 s).
 */
export function useBadgeCounts(intervalMs = 30_000) {
  const [counts, setCounts] = useState<BadgeCounts>({ verifications: 0, reports: 0 });

  const fetchCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/dashboard/badge-counts');
      if (!response.ok) return;

      const json = await response.json();
      const data = json?.data;

      if (data) {
        setCounts({
          verifications: Number(data.verifications) || 0,
          reports: Number(data.reports) || 0,
        });
      }
    } catch {
      // Silently ignore – badges just stay at their last known value.
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    void fetchCounts();

    // Poll periodically
    const id = setInterval(() => void fetchCounts(), intervalMs);
    return () => clearInterval(id);
  }, [fetchCounts, intervalMs]);

  return counts;
}
