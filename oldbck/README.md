# Next.js Starter Template

A production-ready, type-safe full-stack Next.js starter with App Router, Prisma, and Zod validation.

## Features

- **Next.js 14** with App Router and React Server Components
- **API Routes** built into Next.js (no separate backend)
- **Type-safe** end-to-end (Prisma → Zod → TypeScript)
- **Zod validation** shared between frontend and backend
- **Architecture enforcement** via dependency-cruiser
- **Clean separation** of client and server code

---

## How This Template Standardizes Code

This starter enforces consistency through multiple mechanisms that catch violations at build time, not runtime.

### 1. Enforced Architecture Boundaries

The `.dependency-cruiser.js` configuration prevents architectural violations:

| Rule | What It Prevents |
|------|------------------|
| `no-client-importing-server` | Frontend code accessing database directly |
| `no-server-importing-client` | Backend depending on React components |
| `schemas-must-be-pure` | Schemas importing side-effect code |
| `shared-must-be-pure` | Utilities importing app-specific code |
| `no-direct-prisma-in-client` | Client code importing Prisma |
| `no-circular-dependencies` | Circular import chains |

**If you break a rule, `npm run arch:validate` fails.**

### 2. Strict TypeScript

From `tsconfig.json`:
- `strict: true` — No implicit any, null safety enforced
- `noUncheckedIndexedAccess: true` — Array access returns `T | undefined`
- `noImplicitReturns: true` — All code paths must return

### 3. Single Source of Truth

```
Prisma Schema → Zod Schemas → TypeScript Types → API Routes → React Components
     ↓              ↓              ↓                ↓              ↓
  Database      Validation     Inferred         Services      Type-safe UI
```

Define your data model once. Types flow automatically. No duplicate definitions.

### 4. Consistent File Patterns

Every entity follows the same structure:

| Layer | Location | Naming |
|-------|----------|--------|
| Schema | `src/schemas/{entity}.schema.ts` | `createEntitySchema` |
| Service | `src/server/services/{entity}.service.ts` | `entityService` |
| API Route | `src/app/api/{entities}/route.ts` | REST conventions |
| Hook | `src/client/hooks/use{Entity}.ts` | `useEntity()` |
| Component | `src/client/components/{Entity}List.tsx` | PascalCase |

### 5. FAT Services, THIN Routes

- **Services** contain ALL business logic (validation, DB queries, domain rules)
- **Routes** only handle HTTP concerns (parsing request, returning response)

This makes testing easier and prevents logic duplication across endpoints.

---

## How to Use This Template

### Development Workflow Phases

When building features, follow these phases in order:

#### Phase 1: DB_STRUCTURE
Define your data model in Prisma.

```bash
# 1. Edit prisma/schema.prisma
# 2. Validate syntax
npx prisma validate
# 3. Generate client
npm run db:generate
# 4. Push to database
npm run db:push
```

#### Phase 2: API_LAYER
Create schemas, services, and routes.

```bash
# Create these files:
# - src/schemas/{entity}.schema.ts
# - src/server/services/{entity}.service.ts
# - src/app/api/{entities}/route.ts
# - src/app/api/{entities}/[id]/route.ts

# Then verify:
npm run typecheck
npm run arch:validate
```

#### Phase 3: FRONTEND_UI
Create hooks and components.

```bash
# Create these files:
# - src/client/hooks/use{Entity}.ts
# - src/client/components/{Entity}List.tsx

# Then verify:
npm run validate
```

### Key Commands to Remember

| Command | When to Use |
|---------|-------------|
| `npm run dev` | During development |
| `npm run validate` | Before committing (runs ALL checks) |
| `npm run arch:validate` | Check architecture violations only |
| `npm run typecheck` | Check TypeScript errors only |
| `npm run db:generate` | After changing Prisma schema |
| `npm run db:push` | Push schema changes to database |

### Verification Before Commit

Always run before committing:

```bash
npm run validate
```

This runs:
1. TypeScript type checking
2. ESLint linting
3. Architecture validation (dependency-cruiser)
4. Tests (if configured)

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Start development server
npm run dev

# Open the app
open http://localhost:3000
```

## Project Structure

```
src/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   └── api/                     # API routes
│       ├── health/route.ts      # Health check endpoint
│       └── users/               # User CRUD endpoints
│           ├── route.ts         # GET, POST /api/users
│           └── [id]/route.ts    # GET, PUT, DELETE /api/users/:id
│
├── server/                      # Backend code (server-only)
│   ├── db/                      # Prisma client
│   │   └── client.ts            # Prisma singleton
│   ├── services/                # Business logic (KEEP FAT)
│   │   └── user.service.ts      # User service
│   └── errors/                  # AppError class
│
├── client/                      # Frontend code (browser-safe)
│   ├── components/              # React components
│   │   ├── ui/                  # Reusable UI components
│   │   └── UserList.tsx         # Data display component
│   ├── hooks/                   # React hooks
│   │   └── useUsers.ts          # Data fetching hook
│   └── api/                     # API client
│       └── client.ts            # Type-safe fetch wrapper
│
├── shared/                      # Code used by both client & server
│   ├── types/                   # Shared TypeScript types
│   └── utils/                   # Utility functions
│
├── schemas/                     # Shared Zod validation schemas
│   ├── user.schema.ts           # User validation
│   └── _template.schema.ts      # Template for new schemas
│
└── prisma/
    └── schema.prisma            # Database schema
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   Prisma Schema ──▶ Zod Schemas ──▶ API Routes ──▶ React Components    │
│         │                │               │                │             │
│         ▼                ▼               ▼                ▼             │
│   Database Types    Validation      Services        Type-safe UI       │
│                                                                         │
│   Single source of truth ──────────────────────────▶ Type safety       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Layer Boundaries (enforced by dependency-cruiser):
- src/client/ CANNOT import from src/server/
- src/server/ CANNOT import from src/client/
- src/schemas/ and src/shared/ are pure (no app/client/server imports)
```

## Key Principles

### 1. Services Are FAT, Routes Are THIN

All business logic lives in services. API routes only handle HTTP concerns.

```typescript
// src/server/services/user.service.ts
// ✅ GOOD: Logic in service
export const userService = {
  async create(data: CreateUser) {
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) throw AppError.conflict('Email exists');
    return db.user.create({ data });
  },
};

// src/app/api/users/route.ts
// ✅ GOOD: Route is thin wrapper
export async function POST(request: Request) {
  const body = await request.json();
  const data = createUserSchema.parse(body);
  const user = await userService.create(data);
  return NextResponse.json({ success: true, data: user }, { status: 201 });
}
```

### 2. Zod Schemas Are Shared

Same schemas validate on API routes and frontend:

```typescript
// src/schemas/user.schema.ts
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

// API Route: validates request
const data = createUserSchema.parse(body);

// Frontend: validates form
const form = useForm({ resolver: zodResolver(createUserSchema) });
```

### 3. Client/Server Separation

Client components use hooks that call API routes. Only API routes can access server code.

```typescript
// ✅ GOOD: Hook in src/client/hooks/
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    fetch('/api/users').then(res => res.json());
  }, []);
  return users;
}

// ❌ BAD: Client code importing server code
import { db } from '@/server/db'; // ERROR: enforced by dependency-cruiser
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Next.js + ESLint validation |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create migration |
| `npm run db:studio` | Open Prisma Studio |
| `npm run typecheck` | TypeScript validation |
| `npm run arch:validate` | Architecture validation |
| `npm run validate` | All validations + tests |

## Adding a New Entity

### 1. Add Prisma Model

```prisma
// prisma/schema.prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  price       Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

```bash
npm run db:generate
npm run db:push
```

### 2. Create Zod Schema

```typescript
// src/schemas/product.schema.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive(),
});

export type CreateProduct = z.infer<typeof createProductSchema>;
```

Export from `src/schemas/index.ts`.

### 3. Create Service

```typescript
// src/server/services/product.service.ts
import { db } from '@/server/db';
import type { CreateProduct } from '@/schemas';

export const productService = {
  async findMany() { return db.product.findMany(); },
  async create(data: CreateProduct) { return db.product.create({ data }); },
};
```

Export from `src/server/services/index.ts`.

### 4. Create API Routes

```typescript
// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { productService } from '@/server/services';
import { createProductSchema } from '@/schemas';

export async function GET() {
  const products = await productService.findMany();
  return NextResponse.json({ success: true, data: products });
}

export async function POST(request: Request) {
  const body = await request.json();
  const data = createProductSchema.parse(body);
  const product = await productService.create(data);
  return NextResponse.json({ success: true, data: product }, { status: 201 });
}
```

### 5. Create Hook (Frontend)

```typescript
// src/client/hooks/useProducts.ts
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  // ... fetch from /api/products
  return { products, isLoading, error };
}
```

### 6. Verify

```bash
npm run validate
```

## API Response Format

### Success

```json
{
  "success": true,
  "data": { "id": "...", "name": "..." }
}
```

### Success (List)

```json
{
  "success": true,
  "data": {
    "items": [{ "id": "...", "name": "..." }],
    "meta": { "total": 100, "limit": 20, "offset": 0, "hasMore": true }
  }
}
```

### Error

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "User not found" }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `NODE_ENV` | Environment | development |
| `NEXT_PUBLIC_API_URL` | API base URL (optional) | "" |

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS if needed
- [ ] Set up authentication (NextAuth, etc.)
- [ ] Set up monitoring (Vercel Analytics, etc.)
- [ ] Configure database connection pooling
- [ ] Deploy to Vercel, Railway, or similar
#   n e w - p l a n  
 #   n e w - p l a n  
 