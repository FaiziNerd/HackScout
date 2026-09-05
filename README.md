# HackScout

Pakistan ka event hub — hackathons, conferences, workshops, meetups, and competitions, listed by city.

## Stack

- **Next.js 16.3** (App Router, Turbopack) + TypeScript
- **Prisma** + PostgreSQL (Supabase)
- **Supabase Auth** (Google OAuth + magic link)
- **Resend** for deadline reminders, weekly digest, and scraper failure alerts
- **GitHub Actions** for daily scrapers (`npm run scrape:all`)

## Local Setup

1. Copy `.env.example` to `.env` and fill required values.
2. Install deps: `npm install`
3. Generate client: `npm run db:generate`
4. Apply migrations: `npm run db:migrate`
5. Seed data: `npm run db:seed`
6. Run app: `npm run dev`

### Run scrapers locally

```bash
npm run scrape:all
```

Uses `DATABASE_URL` / `DIRECT_URL` from `.env` and writes events straight to the database.

## Deploy

| Piece | Where |
|-------|--------|
| Web app | **Vercel** |
| Daily scrapers | **GitHub Actions** — `.github/workflows/scrape-daily.yml` |
| Email crons | **Vercel** — deadline reminders + weekly digest |

### GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Required |
|--------|----------|
| `DATABASE_URL` | Yes |
| `DIRECT_URL` | Yes |
| `NEXT_PUBLIC_SITE_URL` | Recommended (alert links) |
| `ADMIN_EMAILS` | Recommended (failure alerts) |
| `RESEND_API_KEY` | Recommended |
| `DEADLINE_EMAIL_FROM` | Recommended |

After pushing, open **Actions → Daily scrapers → Run workflow** once to verify.

Schedule: about `00:00` UTC daily (GitHub may delay a few minutes). Manual runs use **workflow_dispatch**.

### Vercel crons

Configured in `vercel.json`:

- `/api/cron/deadline-reminders` — daily
- `/api/cron/weekly-digest` — Mondays

Requires `CRON_SECRET` on Vercel.

Full launch runbook: `docs/production-launch-checklist.md` · detailed plan: `plan.md`

### Launch Automation Commands

```bash
npm run launch:env:check
npm run launch:runtime:check
npm run launch:auth:check
npm run launch:data:check
npm run launch:cron:check
npm run launch:smoke:check
npm run launch:qa:check
npm run launch:check:all
```
