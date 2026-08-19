import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/auth";

export interface Opportunity {
  id: string;
  title: string;
  category: string;
  description: string;
  deadline?: string;
  [key: string]: any;
}

export interface OpportunitiesResponse {
  items: Opportunity[];
  hasMore: boolean;
}

export function useOpportunity(id: string | undefined) {
  return useQuery({
    queryKey: ["opportunity", id],
    queryFn: async (): Promise<Opportunity> => {
      if (!id) throw new Error("ID required");
      const res = await apiRequest(`/api/opportunities/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSearchOpportunities(query: string) {
  return useQuery({
    queryKey: ["opportunity-search", query],
    queryFn: async () => {
      const res = await apiRequest(`/api/opportunities?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      return (await res.json()) as OpportunitiesResponse;
    },
    enabled: query.length >= 3,
    staleTime: 1000 * 60 * 10,
  });
}

export function useOpportunitiesPaginated(category = "all", search = "") {
  return useInfiniteQuery({
    queryKey: ["opportunities", category, search],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        category,
        ...(search && { search }),
      });
      const res = await apiRequest(`/api/opportunities?${params}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as OpportunitiesResponse;
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? (lastPage as any).nextPage : null),
    initialPageParam: 1,
    staleTime: 1000 * 60 * 3,
  });
}
