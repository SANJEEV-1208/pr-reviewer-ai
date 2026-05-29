import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface Repo {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  enabled: boolean;
  focusRules: string[];
}

export function useRepos() {
  return useQuery<Repo[]>({
    queryKey: ['repos'],
    queryFn: () => apiClient.get('/repos').then((r) => r.data),
  });
}

export function useUpdateRepoConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { repoId: number; focusRules: string[]; enabled: boolean }) =>
      apiClient.post(`/repos/${vars.repoId}/config`, {
        focusRules: vars.focusRules,
        enabled: vars.enabled,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repos'] }),
  });
}
