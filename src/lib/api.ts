import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Request failed');
  }
  return json;
}

export function useCreateLead() {
  return useMutation({
    mutationFn: ({ data }: { data: { name: string; email: string; budgetRange: string; message: string } }) =>
      apiFetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useListLeads(params: { search?: string; status?: string } = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);

  return useQuery({
    queryKey: ['leads', params],
    queryFn: async () => {
      const result = await apiFetch(`/api/leads?${searchParams.toString()}`);
      return result.leads as Array<{
        id: number;
        name: string;
        email: string;
        budgetRange: string;
        message: string;
        status: string;
        createdAt: string;
      }>;
    },
  });
}

export function useGetLeadStats() {
  return useQuery({
    queryKey: ['lead-stats'],
    queryFn: () => apiFetch('/api/leads/stats'),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: string } }) =>
      apiFetch(`/api/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiFetch(`/api/leads/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
    },
  });
}

export function getListLeadsQueryKey(params: { search?: string; status?: string } = {}) {
  return ['leads', params];
}

export function getGetLeadStatsQueryKey() {
  return ['lead-stats'];
}
