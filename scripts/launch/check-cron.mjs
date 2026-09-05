#!/usr/bin/env node

import "dotenv/config";

const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
const cronSecret = process.env.CRON_SECRET;

if (!siteUrl) {
  console.error("Missing SITE_URL or NEXT_PUBLIC_SITE_URL.");
  process.exit(1);
}

if (!cronSecret) {
  console.error("Missing CRON_SECRET.");
  process.exit(1);
}

const base = siteUrl.replace(/\/$/, "");
// Scrapers run via GitHub Actions (`.github/workflows/scrape-daily.yml`), not Vercel cron.
const paths = [
  "/api/cron/deadline-reminders",
  "/api/cron/weekly-digest",
];

async function checkPath(path) {
  const response = await fetch(`${base}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
  });

  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status} (${JSON.stringify(body)})`);
  }

  if (!body || body.ok !== true) {
    throw new Error(`${path} did not return ok: true (${JSON.stringify(body)})`);
  }

  console.log(`OK   ${path} -> ${response.status} ${JSON.stringify(body)}`);
}

async function run() {
  console.log(`HackScout cron verification for ${base}`);
  for (const path of paths) {
    await checkPath(path);
  }
  console.log("\nPass: cron endpoints authorized and healthy.");
}

run().catch((error) => {
  console.error(`\nFail: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
