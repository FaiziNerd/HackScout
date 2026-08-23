#!/usr/bin/env node

import { Client } from "pg";

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!directUrl) {
  console.error("Missing DIRECT_URL (or DATABASE_URL fallback).");
  process.exit(1);
}

async function scalar(client, query, values = []) {
  const result = await client.query(query, values);
  return Number(result.rows[0]?.count ?? 0);
}

async function run() {
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    console.log("HackScout production data check");

    const cityCount = await scalar(client, 'select count(*)::int as count from "City"');
    const eventCount = await scalar(
      client,
      'select count(*)::int as count from "Event" where "reviewStatus" = $1 and "status" in ($2, $3)',
      ["approved", "upcoming", "ongoing"],
    );
    const lahoreCount = await scalar(client, 'select count(*)::int as count from "City" where "slug" = $1', [
      "lahore",
    ]);

    console.log(`OK   city rows: ${cityCount}`);
    console.log(`OK   approved live events: ${eventCount}`);
    console.log(`OK   lahore city rows: ${lahoreCount}`);

    if (cityCount <= 0) {
      throw new Error("No city rows found. Run db seed on production.");
    }

    if (lahoreCount <= 0) {
      throw new Error('City slug "lahore" missing. Seed data appears incomplete.');
    }

    if (eventCount <= 0) {
      throw new Error("No approved upcoming/ongoing events found. Seed launch events before go-live.");
    }

    console.log("\nPass: production seed data is present.");
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(`\nFail: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
