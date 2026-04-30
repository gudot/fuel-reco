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
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
# Example:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fuel_reconciliation"
```

### 3. Set up the database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed the database with initial data
npm run db:seed
```

### 4. Run the development server

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

## Authentication & Roles

- **ADMIN** — Full access to all features and user management
- **ACCOUNTANT** — Can record fuel purchases, issue allocations, and view reports
- **OPERATIONS** — Read-only access to review allocations, mileage, and reports

## License

MIT

