import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SuggestNotesInput {
  whiskeyId?: number;
  name?: string;
  distillery?: string;
  type?: string;
  age?: number;
  abv?: number;
}

interface SuggestedNotes {
  nose: string[];
  palate: string[];
  finish: string[];
  summary: string;
  remaining: number;
}

interface EnhanceNotesInput {
  whiskeyId?: number;
  userNotes: string;
  rating?: number;
}

interface EnhancedNotes {
  nose: string;
  palate: string;
  finish: string;
  enhanced: string;
  remaining: number;
}

interface AiStatus {
  dailyLimit: number;
  remaining: number;
  allowed: boolean;
  configured: boolean;
}

export function useAiStatus() {
  return useQuery<AiStatus>({
    queryKey: ["/api/ai/status"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/ai/status");
      if (!response.ok) {
        throw new Error("Failed to fetch AI status");
      }
      return response.json();
    },
    staleTime: 60000, // Cache for 1 minute
  });
}

export function useSuggestNotes() {
  return useMutation<SuggestedNotes, Error, SuggestNotesInput>({
    mutationFn: async (input) => {
      const response = await apiRequest("POST", "/api/ai/suggest-notes", input);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get suggestions");
      }
      return response.json();
    },
  });
}

export function useEnhanceNotes() {
  return useMutation<EnhancedNotes, Error, EnhanceNotesInput>({
    mutationFn: async (input) => {
      const response = await apiRequest("POST", "/api/ai/enhance-notes", input);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to enhance notes");
      }
      return response.json();
    },
  });
}
