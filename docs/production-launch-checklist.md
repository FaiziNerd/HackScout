# HackScout Production Launch Checklist

Sirf remaining production tasks. Local env/build/runtime/data/auth/QA checks already pass ho chuke hain.

## 1) Vercel Web App

- Repo import karein in Vercel (Framework: Next.js).
- Confirm `vercel.json` build command use ho raha hai:
  - `npx prisma generate && npx prisma migrate deploy && next build`
- Vercel project env vars mein local `.env` wali production values add karein:
  - `DATABASE_URL`, `DIRECT_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `CRON_SECRET`
  - `REDIS_URL`
  - `RESEND_API_KEY`, `DEADLINE_EMAIL_FROM`
  - `ADMIN_EMAILS`
  - `GROQ_API_KEY`
- First deploy ke baad generated Vercel URL copy karein.
- `NEXT_PUBLIC_SITE_URL` ko generated Vercel URL par update karein.
- `NEXT_PUBLIC_SITE_URL` update ke baad redeploy karein.

## 2) Worker Hosting

- Render/Railway par worker service create karein.
- Start command:
  - `npm run worker`
- Worker env vars add karein:
  - `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `NEXT_PUBLIC_SITE_URL`
- Startup logs mein confirm karein:
  - `worker listening`
  - scraper schedule registered

## 3) Supabase Auth

- Supabase redirect allow-list mein add karein:
  - `https://YOUR_VERCEL_URL/auth/callback`
  - `http://localhost:3000/auth/callback`
- Production par Google login aur magic link manually verify karein.

## 4) Production Checks

Production URL/env set hone ke baad run karein:

```bash
npm run launch:env:check
npm run launch:runtime:check
npm run launch:auth:check
npm run launch:data:check
npm run launch:cron:check
npm run launch:qa:check
```

Fast path:

```bash
npm run launch:check:all
```

## 5) Manual QA

- `/events` open karke listing verify karein.
- `/cities/lahore` title/content verify karein.
- `/login` se login flow verify karein.
- `/admin` access admin email se verify karein.
- OG share preview LinkedIn/WhatsApp par verify karein.
- Mobile smoke test karein.

## 6) Go-Live Sign-off

- [ ] Vercel app healthy
- [ ] Worker healthy
- [ ] Vercel env vars complete
- [ ] `NEXT_PUBLIC_SITE_URL` production URL par set
- [ ] Supabase callbacks configured
- [ ] Cron endpoints authorized and passing
- [ ] Queue processing verified
- [ ] SEO/share/mobile QA passed