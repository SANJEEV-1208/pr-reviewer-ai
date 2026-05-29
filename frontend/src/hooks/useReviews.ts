import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface ReviewSummary {
  id: number;
  status: string;
  overallAssessment: 'LGTM' | 'NEEDS_CHANGES' | 'CRITICAL_ISSUES' | null;
  commitSha: string;
  durationMs: number | null;
  createdAt: string;
  pr: {
    number: number;
    title: string;
    htmlUrl: string;
    author: string;
    repoFullName: string;
  } | null;
}

export interface ReviewDetail {
  id: number;
  commit_sha: string;
  status: string;
  review_body: string;
  bugs_found: object[];
  security_issues: object[];
  suggestions: object[];
  duration_ms: number | null;
  created_at: string;
}

export function useReviews(limit = 20, offset = 0) {
  return useQuery<ReviewSummary[]>({
    queryKey: ['reviews', limit, offset],
    queryFn: () =>
      apiClient.get(`/reviews?limit=${limit}&offset=${offset}`).then((r) => r.data),
  });
}

export function useReview(id: number) {
  return useQuery<ReviewDetail>({
    queryKey: ['review', id],
    queryFn: () => apiClient.get(`/reviews/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export interface ReviewStats {
  summary: {
    total: string;
    avg_duration_ms: string | null;
    completed: string;
    failed: string;
  };
  assessmentBreakdown: { assessment: string | null; count: string }[];
  dailyActivity: { date: string; count: string }[];
}

export function useReviewStats() {
  return useQuery<ReviewStats>({
    queryKey: ['review-stats'],
    queryFn: () => apiClient.get('/reviews/stats').then((r) => r.data),
  });
}
