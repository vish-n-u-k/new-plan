'use client';

import { useUsers } from '@/client/hooks/useUsers';

export function UserList() {
  const { users, isLoading, error } = useUsers();

  if (isLoading) {
    return <p className="text-muted">Loading users...</p>;
  }

  if (error) {
    return <p className="text-error">Error: {error.message}</p>;
  }

  if (!users || users.length === 0) {
    return (
      <p className="text-muted">
        No users found. Create one using the API.
      </p>
    );
  }

  return (
    <ul style={{ listStyle: 'none' }}>
      {users.map((user) => (
        <li
          key={user.id}
          style={{
            padding: '1rem',
            marginBottom: '0.5rem',
            background: 'var(--muted)',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontWeight: 500 }}>{user.name ?? 'Unnamed'}</div>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>
            {user.email}
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              padding: '0.125rem 0.5rem',
              fontSize: '0.75rem',
              background: user.role === 'ADMIN' ? 'var(--primary)' : 'var(--border)',
              color: user.role === 'ADMIN' ? 'var(--primary-foreground)' : 'var(--foreground)',
              borderRadius: '9999px',
            }}
          >
            {user.role}
          </div>
        </li>
      ))}
    </ul>
  );
}
