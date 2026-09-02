#!/usr/bin/env node

import "dotenv/config";

const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;

if (!siteUrl) {
  console.error("Missing SITE_URL or NEXT_PUBLIC_SITE_URL.");
  process.exit(1);
}

const base = siteUrl.replace(/\/$/, "");

async function fetchText(path, init) {
  const response = await fetch(`${base}${path}`, init);
  const text = await response.text();
  return { response, text };
}

function assertIncludes(html, needle, label) {
  if (!html.includes(needle)) {
    throw new Error(`${label}: expected HTML to include "${needle}"`);
  }
  console.log(`OK   ${label}`);
}

async function run() {
  console.log(`HackScout production smoke check for ${base}`);

  const login = await fetchText("/login");
  if (!login.response.ok) {
    throw new Error(`/login returned ${login.response.status}`);
  }
  assertIncludes(login.text, "Sign in to HackScout with Google", "login page auth methods in metadata");
  assertIncludes(login.text, "Why a desk pass", "login page shell content");

  const events = await fetchText("/events");
  if (!events.response.ok) {
    throw new Error(`/events returned ${events.response.status}`);
  }
  assertIncludes(events.text, "/events/", "events listing links to detail pages");
  assertIncludes(events.text, "Open contents", "mobile Contents trigger on events page");
  assertIncludes(events.text, "Cities", "mobile nav Cities link");

  const slugMatch = events.text.match(/href="\/events\/([^"?]+)"/);
  if (!slugMatch) {
    throw new Error("Could not find an event slug on /events");
  }
  const slug = slugMatch[1];
  console.log(`Info sample event slug: ${slug}`);

  const detail = await fetchText(`/events/${slug}`);
  if (!detail.response.ok) {
    throw new Error(`/events/${slug} returned ${detail.response.status}`);
  }
  assertIncludes(detail.text, slug, "event detail renders slug");
  if (
    !detail.text.includes('property="og:title"') &&
    !detail.text.includes('property="og:image"') &&
    !detail.text.includes("openGraph")
  ) {
    throw new Error(`Event detail missing OG tags for share preview (/events/${slug})`);
  }
  console.log(`OK   /events/${slug} includes OG share metadata`);

  const submit = await fetchText("/submit");
  if (!submit.response.ok) {
    throw new Error(`/submit returned ${submit.response.status}`);
  }
  assertIncludes(submit.text, "Submit", "submit page heading/copy");

  const admin = await fetchText("/admin");
  if (!admin.response.ok) {
    throw new Error(`/admin returned ${admin.response.status}`);
  }
  assertIncludes(admin.text, "Review queue is locked", "admin gated for signed-out users");
  assertIncludes(admin.text, "/login?next=%2Fadmin", "admin sign-in link");

  const cities = await fetchText("/cities");
  if (!cities.response.ok) {
    throw new Error(`/cities returned ${cities.response.status}`);
  }
  assertIncludes(cities.text, "/cities/", "cities index links to city pages");

  console.log("\nPass: automated production smoke checks completed.");
  console.log(
    "Manual: confirm Google login + magic link in browser (https://hack-scout-delta.vercel.app/login).",
  );
}

run().catch((error) => {
  console.error(`\nFail: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
