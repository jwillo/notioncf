# NotionCF

A Notion-like workspace application built on Cloudflare's platform.

## Tech Stack

- **Frontend:** React 18, TypeScript, TipTap, Tailwind CSS, Zustand
- **Backend:** Cloudflare Pages Functions (REST API)
- **Database:** Cloudflare D1 (SQLite)
- **Cache:** Cloudflare KV
- **Storage:** Cloudflare R2
- **Auth:** Cloudflare Access

## Prerequisites

- Node.js >= 20.x
- npm >= 10.x
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

## Setup

### 1. Install dependencies

```bash
cd notioncf
npm install
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create Cloudflare resources

```bash
# Create D1 database
wrangler d1 create notioncf-db

# Create KV namespace
wrangler kv:namespace create CACHE

# Create R2 bucket
wrangler r2 bucket create notioncf-files
```

### 4. Update wrangler.toml

Copy the IDs from the commands above and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "notioncf-db"
database_id = "<your-d1-database-id>"

[[kv_namespaces]]
binding = "CACHE"
id = "<your-kv-namespace-id>"
```

### 5. Run database migrations

```bash
wrangler d1 execute notioncf-db --file=migrations/0001_initial.sql
```

### 6. Configure Cloudflare Access (Production)

1. Go to Cloudflare Zero Trust dashboard
2. Create an Access Application for your Pages URL
3. Configure authentication (email OTP, SSO, etc.)
4. Add allowed users/groups

## Development

### Start dev server

```bash
npm run dev
```

This starts Vite on `http://localhost:5173` with API proxy to Wrangler.

### Run with Cloudflare bindings locally

```bash
npm run build
npm run cf:dev
```

This runs the full stack locally with D1, KV, and R2 bindings.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript check |
| `npm run cf:dev` | Run with Cloudflare bindings |
| `npm run cf:deploy` | Deploy to Cloudflare Pages |

## Project Structure

```
notioncf/
├── functions/          # Cloudflare Pages Functions (API)
│   └── api/
│       ├── _middleware.ts
│       └── pages/
├── src/                # React frontend
│   ├── components/
│   ├── hooks/
│   ├── stores/
│   └── services/
├── shared/             # Shared TypeScript types
├── migrations/         # D1 database migrations
└── wrangler.toml       # Cloudflare configuration
```

## Deployment

### Manual deployment

```bash
npm run build
npm run cf:deploy
```

### CI/CD (GitHub Actions)

Push to `main` branch triggers automatic deployment. Required secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Documentation

- [PRD](../docs/prd.md) - Product Requirements Document
- [Architecture](../docs/architecture.md) - Technical Architecture

## License

Private - All rights reserved
