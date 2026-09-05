#!/usr/bin/env node

import "dotenv/config";
import { createPostgresClient } from "./postgres.mjs";

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

async function checkPostgres(label, connectionString) {
  const client = createPostgresClient(connectionString);

  await client.connect();
  const result = await client.query("select 1 as ok");
  await client.end();

  if (!result.rows[0]?.ok) {
    throw new Error(`${label} query failed.`);
  }

  console.log(`OK   ${label} connection query passed.`);
}

async function run() {
  console.log("HackScout runtime dependency check");
  await checkPostgres("DATABASE_URL", databaseUrl);
  if (directUrl) {
    await checkPostgres("DIRECT_URL", directUrl);
  } else {
    console.log("WARN DIRECT_URL missing: migrate deploy may fail in production.");
  }
  console.log("\nPass: database connectivity checks completed.");
}

run().catch((error) => {
  console.error(`\nFail: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
