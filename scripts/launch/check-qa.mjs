#!/usr/bin/env node

const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
const citySlug = process.env.CITY_SLUG || "lahore";
const cityName = process.env.CITY_NAME || "Lahore";
const year = String(new Date().getFullYear());

if (!siteUrl) {
  console.error("Missing SITE_URL or NEXT_PUBLIC_SITE_URL.");
  process.exit(1);
}

const base = siteUrl.replace(/\/$/, "");

async function assertOk(path) {
  const response = await fetch(`${base}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  console.log(`OK   ${path} -> ${response.status}`);
  return response;
}

async function run() {
  console.log(`HackScout QA check for ${base}`);

  await assertOk("/sitemap.xml");
  await assertOk("/robots.txt");

  const cityResponse = await assertOk(`/cities/${citySlug}`);
  const cityHtml = await cityResponse.text();
  const expectedTitle = `Hackathons in ${cityName} ${year}`;
  if (!cityHtml.includes(expectedTitle)) {
    throw new Error(
      `City SEO title not found. Expected to include "${expectedTitle}" on /cities/${citySlug}.`,
    );
  }
  console.log(`OK   /cities/${citySlug} title includes "${expectedTitle}"`);

  const eventListing = await assertOk("/events");
  const eventsHtml = await eventListing.text();
  if (!eventsHtml.includes("og:") && !eventsHtml.includes("openGraph")) {
    console.log("WARN /events: OG tags not confidently detected in HTML snapshot.");
  } else {
    console.log("OK   /events includes OG-related markup.");
  }

  console.log("\nPass: core launch QA checks completed.");
}

run().catch((error) => {
  console.error(`\nFail: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
