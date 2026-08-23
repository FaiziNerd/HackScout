#!/usr/bin/env node

const required = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "CRON_SECRET",
  "REDIS_URL",
];

const recommended = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "DEADLINE_EMAIL_FROM",
  "ADMIN_EMAILS",
  "OPENAI_API_KEY",
];

function isFilled(key) {
  return Boolean(process.env[key] && process.env[key].trim().length > 0);
}

function printBlock(title, keys) {
  console.log(`\n${title}`);
  let missing = 0;

  for (const key of keys) {
    const ok = isFilled(key);
    if (!ok) missing += 1;
    console.log(`${ok ? "OK  " : "MISS"} ${key}`);
  }

  return missing;
}

console.log("HackScout production env check");
const requiredMissing = printBlock("Required", required);
const recommendedMissing = printBlock("Recommended", recommended);

console.log("\nSummary");
console.log(`Required missing: ${requiredMissing}`);
console.log(`Recommended missing: ${recommendedMissing}`);

if (requiredMissing > 0) {
  console.error("\nFail: fill all required variables before production launch.");
  process.exit(1);
}

console.log("\nPass: required production variables are present.");
