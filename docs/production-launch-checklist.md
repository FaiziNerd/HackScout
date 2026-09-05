# HackScout Production Launch Checklist

## Go-Live Sign-off

- [ ] Vercel app healthy
- [ ] GitHub Actions secrets set (`DATABASE_URL`, `DIRECT_URL`)
- [ ] Manual **Daily scrapers** workflow run succeeded
- [ ] Env vars complete on Vercel (incl. `CRON_SECRET`, Resend)
- [ ] Supabase Auth callbacks configured
- [ ] Migrations + seed done
- [ ] Deadline + weekly-digest crons authorized (`npm run launch:cron:check`)
- [ ] SEO/share/mobile QA passed
