import { UserList } from '@/client/components/UserList';

export default function Home() {
  return (
    <main className="container" style={{ padding: '2rem 1rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Next.js Starter Template</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>
        A full-stack Next.js starter with TypeScript, Prisma, and Zod validation.
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>API Endpoints</h2>
        <ul style={{ listStyle: 'none' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <code style={{
              background: 'var(--muted)',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px'
            }}>
              GET /api/health
            </code>
            {' '}— Health check
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <code style={{
              background: 'var(--muted)',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px'
            }}>
              GET /api/users
            </code>
            {' '}— List users
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <code style={{
              background: 'var(--muted)',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px'
            }}>
              POST /api/users
            </code>
            {' '}— Create user
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <code style={{
              background: 'var(--muted)',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px'
            }}>
              GET /api/users/:id
            </code>
            {' '}— Get user by ID
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <code style={{
              background: 'var(--muted)',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px'
            }}>
              PUT /api/users/:id
            </code>
            {' '}— Update user
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <code style={{
              background: 'var(--muted)',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px'
            }}>
              DELETE /api/users/:id
            </code>
            {' '}— Delete user
          </li>
        </ul>
      </section>

      <section>
        <h2 style={{ marginBottom: '1rem' }}>Users</h2>
        <UserList />
      </section>
    </main>
  );
}
