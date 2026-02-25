'use client';

import { useState, useEffect, useCallback } from 'react';

import type { User } from '@/schemas';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

interface UseUsersResult {
  users: User[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<User[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users');
      const data = (await response.json()) as ApiResponse<PaginatedResponse<User>>;

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message ?? 'Failed to fetch users');
      }

      setUsers(data.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers,
  };
}
