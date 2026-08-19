import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/auth';

interface UserStats {
  total_applications: number;
  total_submitted: number;
  total_connections: number;
  badges_earned: string[];
  total_xp: number;
  last_activity: string;
}

interface OpportunitiesMetrics {
  total_opportunities: number;
  by_category: Record<string, number>;
  total_bookmarks: number;
  trending_opportunities: Array<{
    id: string;
    title: string;
    applies_count: number;
    likes_count: number;
  }>;
}

interface ConversionMetrics {
  bookmarked_to_applied: number; // percentage
  applied_to_submitted: number; // percentage
  average_time_to_submit: string; // duration
}

/**
 * Fetch user engagement statistics
 * Cached for 10 minutes as it's not realtime data
 */
export function useUserStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async (): Promise<UserStats> => {
      const res = await apiRequest(`/api/user-engagement?user_id=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch user stats');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Fetch opportunities analytics/insights
 * Shows trending opportunities, category distribution, etc.
 */
export function useOpportunitiesMetrics() {
  return useQuery({
    queryKey: ['opportunities-metrics'],
    queryFn: async (): Promise<OpportunitiesMetrics> => {
      const res = await apiRequest('/api/insights?type=opportunities');
      if (!res.ok) throw new Error('Failed to fetch opportunities metrics');
      return res.json();
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Fetch conversion metrics (funnel analysis)
 * Bookmarked → Applied → Submitted
 */
export function useConversionMetrics(userId: string | undefined) {
  return useQuery({
    queryKey: ['conversion-metrics', userId],
    queryFn: async (): Promise<ConversionMetrics> => {
      const res = await apiRequest(`/api/insights?type=conversion&user_id=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch conversion metrics');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 20, // 20 minutes
  });
}

/**
 * Fetch trending opportunities for current week
 * Shows what's hot and getting engagement
 */
export function useTrendingOpportunities() {
  return useQuery({
    queryKey: ['trending-opportunities'],
    queryFn: async () => {
      const res = await apiRequest('/api/opportunities?trending=true&limit=10');
      if (!res.ok) throw new Error('Failed to fetch trending');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes (updates frequently)
  });
}

/**
 * Track event for analytics
 * Used for custom event tracking that isn't auto-tracked
 */
export async function trackAnalyticsEvent(
  eventType: string,
  metadata?: Record<string, any>
) {
  try {
    await apiRequest('/api/engagement-log', {
      method: 'POST',
      body: JSON.stringify({
        event_type: eventType,
        metadata,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

/**
 * Get success stories - opportunities where many users applied and succeeded
 */
export function useSuccessStories(category?: string) {
  return useQuery({
    queryKey: ['success-stories', category],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: 'success_stories',
        ...(category && { category }),
      });
      const res = await apiRequest(`/api/insights?${params}`);
      if (!res.ok) throw new Error('Failed to fetch success stories');
      return res.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (static content)
  });
}
