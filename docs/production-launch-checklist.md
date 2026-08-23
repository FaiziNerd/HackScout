# HackScout Production Launch Checklist

Completed checks marked hain. Remaining work order mein run karein.

## 1) Vercel Web App

- Repo import karein in Vercel (Framework: Next.js).
- Build command ensure karein:
  - `npx prisma generate && npx prisma migrate deploy && next build`
- Domain set karein (`NEXT_PUBLIC_SITE_URL` isi canonical URL par ho).

## 2) Env Vars (Remaining)

- Must fix first:
  - [x] `REDIS_URL` set hai (required)
  - [ ] `NEXT_PUBLIC_SITE_URL` ko localhost se production domain par update karo
- Recommended add karo:
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [x] `RESEND_API_KEY`
  - [ ] `DEADLINE_EMAIL_FROM`
  - [ ] `ADMIN_EMAILS`
  - [x] `GROQ_API_KEY`
- Production env load karne ke baad run:

```bash
npm run launch:env:check
npm run launch:runtime:check
```

- Required vars final pass honi chahiye:
  - `DATABASE_URL`, `DIRECT_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `REDIS_URL`
- [x] `npm run launch:env:check` required vars pass.
- [x] `npm run launch:runtime:check` DB + Redis connectivity pass.

## 3) Worker (Render/Railway)

- Start command:
  - `npm run worker`
- Required worker env:
  - `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `NEXT_PUBLIC_SITE_URL`
- Startup logs mein queue listener aur schedule registration confirm karein.

## 4) Supabase Auth

- Redirect allow-list:
  - `https://YOUR_DOMAIN/auth/callback`
  - `http://localhost:3000/auth/callback`
- App + Supabase auth service readiness:

```bash
npm run launch:auth:check
```
- [x] Supabase auth service reachable.
- [x] `/auth/callback` route exists and redirects without code.
- Google + magic link दोनों production mein manually verify karein.

## 5) Production DB

```bash
npm run db:migrate:deploy
npm run db:seed
npm run launch:data:check
```

- Verify:
  - `/events`
  - `/cities/lahore`
- [x] `npm run launch:data:check` pass: city rows, approved live events, and Lahore city present.

## 6) Cron + Queue

```bash
npm run launch:cron:check
```

- Script sab cron endpoints ko `Authorization: Bearer <CRON_SECRET>` se hit karta hai.
- Har response mein `ok: true` expect hota hai.

## 7) Launch QA

```bash
npm run launch:qa:check
```

- Script checks:
  - `/sitemap.xml`
  - `/robots.txt`
  - `/cities/lahore` title contains `Hackathons in Lahore <year>`
- [x] Local `npm run launch:qa:check` pass on `http://localhost:3000`.
- [ ] Production domain par launch QA run karo.
- OG share preview (LinkedIn/WhatsApp) aur mobile smoke manual rehta hai.

## Fast Path (Automated)

```bash
npm run launch:check:all
```

- Yeh env, runtime, auth, data, cron, aur QA checks sequence mein chalata hai.

## 8) Go-Live Sign-off

- Remaining final checks:
- [ ] Vercel app healthy
- [ ] Worker healthy
- [ ] Env vars complete
- [ ] Supabase callbacks configured
- [ ] Migrations + seed done
- [ ] Cron endpoints authorized and passing
- [ ] Queue processing verified
- [ ] SEO/share/mobile QA passed
