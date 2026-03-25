# PureWork Family Tree

A digital family tree application built with Next.js, PostgreSQL, and Prisma. Features an interactive tree visualization, family statistics dashboard, and role-based management interface.

## Features

- **Interactive Tree Visualization** — zoom/pan (mouse + touch), search people, drill-down sub-trees
- **PDF Export** — download the family tree as a landscape A4 PDF
- **Rich Node Display** — name, age, hometown, phone number, WhatsApp link
- **Detail Panel** — click any node to see full profile, relations, kids count
- **Statistics Dashboard** — age distribution, gender split, occupation breakdown
- **Role-Based Access** — Admin (full control) and Contributor (manage data)
- **Public Password Gate** — family tree and statistics protected by a public password
- **Smart Pagination** — numbered page buttons with intelligent gaps
- **Searchable Dropdowns** — type-to-filter across all person selection fields
- **Mobile Responsive** — touch support for pan/drag, collapsible menu on small screens
- **Docker Support** — multi-stage build, Docker Compose with PostgreSQL

## Quick Start

### Docker (Recommended)

```bash
git clone <repo-url> && cd purework-family
docker compose up -d

# Seed initial data
docker compose --profile seed run seed

# Or seed with 100 people for testing
SEED_SIZE=big docker compose --profile seed run seed
```

Open http://localhost:3000

### Manual Setup

**Requirements:** Node.js 20+, PostgreSQL

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env  # edit DATABASE_URL, NEXTAUTH_SECRET

# 3. Setup database
npx prisma db push
npx prisma db seed           # 10 people (default)
# or
SEED_SIZE=big npx prisma db seed  # 100 people

# 4. Start development server
npm run dev
```

Open http://localhost:3000

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/purework_family` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | `your-secret-key-change-in-production` | JWT signing key (change in production!) |
| `NEXTAUTH_URL` | `http://localhost:3000` | Application URL |
| `SEED_SIZE` | `small` | Seed mode: `small` (10 people) or `big` (100 people) |

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Contributor | `contributor` | `admin123` |
| Public (tree/stats) | — | `public123` |

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Dashboard login |
| `/family-tree` | Public (password) | Interactive tree visualization |
| `/statistics` | Public (password) | Family statistics |
| `/dashboard` | Authenticated | Stats overview |
| `/dashboard/people` | Authenticated | Manage family members |
| `/dashboard/relations` | Authenticated | Manage relationships |
| `/dashboard/users` | Admin only | Manage users |
| `/dashboard/settings` | Admin only | Family name, public password |

## Docker

### Build and Run

```bash
# Start app + database
docker compose up -d

# Run seed (first time or reset)
docker compose --profile seed run seed

# View logs
docker compose logs -f app
```

### Podman

Works with `podman compose` (Podman 4.1+):

```bash
podman compose up -d
podman compose --profile seed run seed
```

### Production Deployment

1. Set `NEXTAUTH_SECRET` to a strong random value
2. Set `NEXTAUTH_URL` to your domain
3. Use a persistent PostgreSQL instance
4. Run `docker compose up -d`

## Database Schema

### Person
- `fullname`, `callName`, `gender` (MALE/FEMALE)
- `dateOfBirth`, `dateOfDeath`
- `occupation`, `hometown`, `domicile`, `phone`

### PersonRelation
- `fromPersonId` → `toPersonId` with `relationType`:
  - `PASANGAN` (spouse) — `fromPersonId` = husband, `toPersonId` = wife
  - `ORANGTUA_ANAK` (parent-child) — `fromPersonId` = child, `toPersonId` = parent
- `relationSubType`: `BIOLOGICAL`, `ADOPTED`, `DIVORCED`
- `urutan`: spouse order (1st, 2nd, etc.)

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint check
npx prisma studio  # Database browser (http://localhost:5555)
```

## Tech Stack

- **Framework:** Next.js 14 (App Router, standalone output)
- **Database:** PostgreSQL 16
- **ORM:** Prisma 5
- **Auth:** NextAuth.js
- **UI:** Tailwind CSS, Lucide React icons
- **Tree:** react-family-tree + relatives-tree
- **PDF:** html-to-image + jsPDF
- **Search:** Custom SearchableSelect component

## License

MIT
