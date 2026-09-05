# HackScout Production Launch Plan

## Objective
Deploy HackScout to production with a working web app, database, auth callbacks, cron jobs, daily GitHub Actions scrapers, and launch QA checks.

## 1) Vercel Web App Deployment
- Create/import project in Vercel from this repo.
- Framework: Next.js.
- Build command:
  - `npx prisma generate && npx prisma migrate deploy && next build`
- Set production domain (custom domain or Vercel domain).
- Ensure successful production deployment.

## 2) Production Environment Variables

### Required
- `DATABASE_URL` (Supabase pooler)
- `DIRECT_URL` (Supabase direct/session connection)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (canonical production URL)
- `CRON_SECRET`

### Recommended
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `DEADLINE_EMAIL_FROM`
- `ADMIN_EMAILS`
- `GROQ_API_KEY`

## 3) Daily scrapers (GitHub Actions)
- Workflow: `.github/workflows/scrape-daily.yml` (`npm run scrape:all`)
- Add Actions secrets: `DATABASE_URL`, `DIRECT_URL` (plus alert/mail secrets if desired)
- Confirm a manual **Run workflow** succeeds before relying on the daily schedule

## 4) Supabase Auth Production Config
- In Supabase Auth redirect/callback allow-list, add:
  - `https://YOUR_DOMAIN/auth/callback`
- Keep local callback for development:
  - `http://localhost:3000/auth/callback`
- Test Google login + magic link login in production.

## 4.1) Supabase Project Checklist (Must Verify)
- Auth providers enabled:
  - Google OAuth enabled
  - Email OTP/magic link enabled
- URL config set:
  - Site URL points to production app domain
  - Redirect allow-list includes production callback URL
- Keys validated in deployment platform:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only secret)
- Connection strings verified:
  - `DATABASE_URL` = pooler/runtime connection
  - `DIRECT_URL` = direct/session connection for migrations and seed
- Quick auth smoke test in production:
  - Sign in with Google
  - Sign in with magic link
  - Callback returns user to app without error

## 5) Production Database Prep
- Run migrations on production database:
  - `npm run db:migrate:deploy`
- Seed production data:
  - `npm run db:seed`
- Validate city/event data appears on:
  - `/events`
  - `/cities/lahore` (or other city pages)

## 6) Cron Verification
- Trigger deadline reminders:
  - `GET /api/cron/deadline-reminders` with header `Authorization: Bearer <CRON_SECRET>`
- Trigger weekly digest:
  - `GET /api/cron/weekly-digest` with same auth header
- Confirm responses are `ok: true`.
- Confirm GitHub Actions **Daily scrapers** run completed successfully.

## 7) Launch QA Checks
- `https://YOUR_DOMAIN/sitemap.xml` resolves.
- `https://YOUR_DOMAIN/robots.txt` resolves.
- City SEO title check on `/cities/lahore`:
  - "Hackathons in Lahore <year>"
- OG/share preview works on:
  - LinkedIn
  - WhatsApp
- Basic mobile smoke test:
  - Home
  - Events listing
  - Event detail
  - Login
  - Submit flow

## 8) Go-Live Sign-off
- [ ] Vercel app healthy
- [ ] GitHub Actions daily scrapers configured + tested
- [ ] Env vars complete
- [ ] Supabase callbacks configured
- [ ] Migrations + seed done
- [ ] Cron endpoints authorized and passing
- [ ] SEO/share/mobile QA passed
