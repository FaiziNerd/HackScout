# HackScout

Pakistan ka event hub — every hackathon, conference, workshop, meetup, and competition, listed by city.

## Stack

- **Next.js 16.3** (App Router, Turbopack) + TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **Prisma** + PostgreSQL (Supabase)
- **Supabase Auth** (wired in a later step)

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase Postgres URL and keys.
2. Install: `npm install`
3. Generate Prisma Client: `npm run db:generate`
4. Dev server: `npm run dev` → [http://localhost:3000](http://localhost:3000)

## Current status

Foundation scaffold only. Prisma models, scrapers, and the city feed are not built yet.
