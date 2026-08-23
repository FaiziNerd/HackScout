#!/usr/bin/env node

import "dotenv/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;

if (!supabaseUrl || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

if (!siteUrl) {
  console.error("Missing SITE_URL or NEXT_PUBLIC_SITE_URL.");
  process.exit(1);
}

const base = siteUrl.replace(/\/$/, "");

async function checkSupabaseAuthHealth() {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/health`, {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase auth health failed (${response.status}): ${body}`);
  }

  console.log(`OK   Supabase auth service reachable (${response.status}).`);
}

async function checkCallbackRoute() {
  const response = await fetch(`${base}/auth/callback`, { redirect: "manual" });
  if (response.status !== 307 && response.status !== 302) {
    throw new Error(`/auth/callback expected redirect, got ${response.status}`);
  }

  const location = response.headers.get("location");
  if (!location || !location.includes("/login?error=missing_code")) {
    throw new Error(`/auth/callback redirect target unexpected: ${location || "none"}`);
  }

  console.log("OK   /auth/callback route exists and redirects without code.");
}

async function run() {
  console.log("HackScout auth readiness check");
  await checkSupabaseAuthHealth();
  await checkCallbackRoute();
  console.log("\nPass: auth dependencies and callback route checks completed.");
}

run().catch((error) => {
  console.error(`\nFail: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
