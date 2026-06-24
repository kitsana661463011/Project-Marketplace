import { useState, useCallback, useEffect } from 'react';
import type { DashboardMetrics, LoadingState } from '../types';
import { mockDashboardMetrics } from '../data/mockData';

/**
 * Hook to fetch and manage dashboard metrics
 */
export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(mockDashboardMetrics);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: null,
  });

  // Simulate fetching data from an API
  const fetchMetrics = useCallback(async () => {
    setLoading({ isLoading: true, error: null });
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, you would fetch from an API like:
      // const response = await fetch('/api/dashboard/metrics');
      // const data = await response.json();
      // setMetrics(data);

      setMetrics(mockDashboardMetrics);
      setLoading({ isLoading: false, error: null });
    } catch (error) {
      setLoading({
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  }, []);

  // Fetch metrics on component mount
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, refetch: fetchMetrics };
};

/**
 * Hook to manage active navigation item
 */
export const useNavigation = (initialItemId: string = 'dashboard') => {
  const [activeItemId, setActiveItemId] = useState(initialItemId);

  const navigate = useCallback((itemId: string) => {
    setActiveItemId(itemId);
    // Scroll to top when navigating
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { activeItemId, navigate };
};

/**
 * Hook to manage search state
 */
export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
    // Implement search logic here
    // For now, just clear results if query is empty
    if (!query) {
      setSearchResults([]);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return { searchQuery, searchResults, search, clearSearch };
};

/**
 * Hook to manage modal state
 */
export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return { isOpen, open, close, toggle };
};
