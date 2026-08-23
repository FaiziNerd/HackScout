# HackScout

Pakistan ka event hub — hackathons, conferences, workshops, meetups, and competitions, listed by city.

## Stack

- **Next.js 16.3** (App Router, Turbopack) + TypeScript
- **Prisma** + PostgreSQL (Supabase)
- **Supabase Auth** (Google OAuth + magic link)
- **BullMQ** + Redis for scraper jobs

## Local Setup

1. Copy `.env.example` to `.env`.
2. Install deps: `npm install`
3. Generate client: `npm run db:generate`
4. Apply migrations: `npm run db:migrate`
5. Seed data: `npm run db:seed`
6. Run app: `npm run dev`

## Deploy

- Web app: **Vercel**
- Worker: **Render** or **Railway**
- Full launch runbook: `docs/production-launch-checklist.md`

### Launch Automation Commands

```bash
npm run launch:env:check
npm run launch:runtime:check
npm run launch:auth:check
npm run launch:data:check
npm run launch:cron:check
npm run launch:qa:check
npm run launch:check:all
```
