/**
 * Custom hook for managing blips state and operations
 * Handles fetching, caching, and real-time updates
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiRequest } from '../lib/auth';
import type { Blip, BlipFetchParams } from '../types/blips';

interface UseBlipsOptions {
  initialPage?: number;
  pageSize?: number;
  autoFetch?: boolean;
}

interface UseBlipsReturn {
  blips: Blip[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  fetchBlips: (params?: BlipFetchParams) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  addBlip: (blip: Blip) => void;
  removeBlip: (blipId: string) => void;
  updateBlip: (blipId: string, updates: Partial<Blip>) => void;
}

export function useBlips(options: UseBlipsOptions = {}): UseBlipsReturn {
  const { initialPage = 1, pageSize = 10, autoFetch = true } = options;
  
  const [blips, setBlips] = useState<Blip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchedIdsRef = useRef(new Set<string>());
  const fetchedEmbedIdsRef = useRef(new Set<string>());

  const fetchBlips = useCallback(async (params: BlipFetchParams = {}) => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentPage = params.page ?? page;
    const isInitialLoad = currentPage === 1;

    setLoading(isInitialLoad);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
        ...(params.search && { search: params.search }),
        ...(params.type && { type: params.type }),
      });

      const response = await apiRequest(`/api/blips?${queryParams}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch blips: ${response.statusText}`);
      }

      const data: Blip[] = await response.json();

      setBlips(prev => {
        if (isInitialLoad) {
          // Reset tracking sets on refresh
          fetchedIdsRef.current.clear();
          fetchedEmbedIdsRef.current.clear();
        }

        // Deduplicate by ID and embed_id
        const newBlips = data.filter(blip => {
          if (fetchedIdsRef.current.has(blip.id)) return false;
          if (blip.embed_id && fetchedEmbedIdsRef.current.has(blip.embed_id)) return false;
          
          fetchedIdsRef.current.add(blip.id);
          if (blip.embed_id) fetchedEmbedIdsRef.current.add(blip.embed_id);
          
          return true;
        });

        return isInitialLoad ? newBlips : [...prev, ...newBlips];
      });

      setHasMore(data.length >= pageSize);
      
      if (!isInitialLoad) {
        setPage(currentPage);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load blips';
      setError(errorMessage);
      console.error('[useBlips] Error:', err);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [page, pageSize]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await fetchBlips({ page: page + 1 });
  }, [loading, hasMore, page, fetchBlips]);

  const refresh = useCallback(async () => {
    setPage(1);
    setHasMore(true);
    fetchedIdsRef.current.clear();
    fetchedEmbedIdsRef.current.clear();
    await fetchBlips({ page: 1 });
  }, [fetchBlips]);

  const addBlip = useCallback((blip: Blip) => {
    setBlips(prev => [blip, ...prev]);
    fetchedIdsRef.current.add(blip.id);
    if (blip.embed_id) fetchedEmbedIdsRef.current.add(blip.embed_id);
  }, []);

  const removeBlip = useCallback((blipId: string) => {
    setBlips(prev => {
      const removed = prev.find(b => b.id === blipId);
      if (removed) {
        fetchedIdsRef.current.delete(removed.id);
        if (removed.embed_id) fetchedEmbedIdsRef.current.delete(removed.embed_id);
      }
      return prev.filter(b => b.id !== blipId);
    });
  }, []);

  const updateBlip = useCallback((blipId: string, updates: Partial<Blip>) => {
    setBlips(prev => prev.map(blip => 
      blip.id === blipId ? { ...blip, ...updates } : blip
    ));
  }, []);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchBlips({ page: 1 });
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    blips,
    loading,
    error,
    hasMore,
    fetchBlips,
    loadMore,
    refresh,
    addBlip,
    removeBlip,
    updateBlip,
  };
}
