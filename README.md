# Fuel Reconciliation System

# Pre-requisites
- Node.js 20+ and npm
- PostgreSQL database

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
AUTH_SECRET="replace-with-at-least-24-random-characters"
NEXT_PUBLIC_APP_NAME="Fuel Reconciliation System"
# Example:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fuel_reconciliation"
# DIRECT_URL="postgresql://postgres:postgres@localhost:5432/fuel_reconciliation"
```

`DATABASE_URL` is used by the deployed app at runtime. Use the pooled connection string from your Firebase-connected PostgreSQL provider when one is available. `DIRECT_URL` is used by Prisma migrations and should point to the direct, non-pooled database URL. If your provider only gives one PostgreSQL URL, use it for both values until a separate direct URL is available.

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

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_NAME`

The build command is:

```bash
npm run build
```

The build script runs `prisma generate` before `next build`, so the Prisma Client is regenerated during Vercel builds. Run `npm run prisma:deploy` against the production database before promoting a deployment that includes schema changes.

## Authentication & Roles

- **ADMIN** — Full access to all features and user management
- **ACCOUNTANT** — Can record fuel purchases, issue allocations, and view reports
- **OPERATIONS** — Read-only access to review allocations, mileage, and reports

## License

MIT

