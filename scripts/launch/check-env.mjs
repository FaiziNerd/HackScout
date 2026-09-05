#!/usr/bin/env node

import "dotenv/config";

const required = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "CRON_SECRET",
];

/** Needed for organizer publish-confirm emails after /submit */
const publishConfirm = ["RESEND_API_KEY", "DEADLINE_EMAIL_FROM"];

const recommended = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_EMAILS",
  "GROQ_API_KEY",
  // Optional; createPublishToken falls back to CRON_SECRET when empty
  "PUBLISH_TOKEN_SECRET",
];

function isFilled(key) {
  return Boolean(process.env[key] && process.env[key].trim().length > 0);
}

function printBlock(title, keys, { optionalEmptyOk = false } = {}) {
  console.log(`\n${title}`);
  let missing = 0;

  for (const key of keys) {
    const ok = isFilled(key);
    if (!ok && !optionalEmptyOk) missing += 1;
    const label = ok ? "OK  " : optionalEmptyOk ? "SKIP" : "MISS";
    console.log(`${label} ${key}`);
  }

  return missing;
}

console.log("HackScout production env check");
const requiredMissing = printBlock("Required", required);
const publishMissing = printBlock("Publish confirm (organizer email → live)", publishConfirm);
printBlock("Recommended", recommended, {
  optionalEmptyOk: true,
});

const publishSigningOk = isFilled("PUBLISH_TOKEN_SECRET") || isFilled("CRON_SECRET");
console.log(`\nPublish link signing: ${publishSigningOk ? "OK  " : "MISS"} PUBLISH_TOKEN_SECRET or CRON_SECRET`);

console.log("\nSummary");
console.log(`Required missing: ${requiredMissing}`);
console.log(`Publish confirm missing: ${publishMissing}`);
console.log(
  `Recommended empty (ok): ${recommended.filter((key) => !isFilled(key)).length}`,
);

const scraperOptional = [
  "FACEBOOK_EVENT_URLS",
  "FACEBOOK_PAGE_URLS",
  "LUMA_PAGE_URLS",
  "LUMA_CALENDAR_SLUGS",
];

console.log("\nScraper coverage (optional — warn if empty in production)");
for (const key of scraperOptional) {
  const ok = isFilled(key);
  console.log(`${ok ? "OK  " : "WARN"} ${key}`);
}

if (requiredMissing > 0 || publishMissing > 0 || !publishSigningOk) {
  console.error("\nFail: fill required + publish-confirm variables before production launch.");
  process.exit(1);
}

console.log("\nPass: required production variables are present.");
