# Fuel Reconciliation System

# Pre-requisites
- Node.js 20+ and npm
- Supabase project with the Vercel integration connected

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```env
POSTGRES_PRISMA_URL="postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require&pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
AUTH_SECRET="replace-with-at-least-24-random-characters"
NEXT_PUBLIC_APP_NAME="Fuel Reconciliation System"
```

`POSTGRES_PRISMA_URL` is used by Prisma at runtime. `POSTGRES_URL_NON_POOLING` is used by Prisma migrations and should be the direct, non-pooled Supabase database URL. The Supabase Vercel integration normally creates both variables automatically.

Generate `AUTH_SECRET` with a long random value. It must be at least 24 characters because it signs login session cookies.

### 3. Set up the database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed the database with initial data
npm run db:seed
```

For production deployments, run migrations with:

```bash
npm run prisma:deploy
```

### 4. Run the development server

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

## Vercel Deployment

Set these environment variables in Vercel for Production, Preview, and Development as needed:

- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_NAME`

The build command is:

```bash
npm run build
```

The build script runs `prisma generate` before `next build`, so the Prisma Client is regenerated during Vercel builds. Run `npm run prisma:deploy` against the Supabase production database before promoting a deployment that includes schema changes.

## Authentication & Roles

- **ADMIN** — Full access to all features and user management
- **ACCOUNTANT** — Can record fuel purchases, issue allocations, and view reports
- **OPERATIONS** — Read-only access to review allocations, mileage, and reports

## License

MIT

