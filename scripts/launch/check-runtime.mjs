#!/usr/bin/env node

import { Client } from "pg";
import IORedis from "ioredis";

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
const redisUrl = process.env.REDIS_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

if (!redisUrl) {
  console.error("Missing REDIS_URL.");
  process.exit(1);
}

async function checkPostgres(label, connectionString) {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const result = await client.query("select 1 as ok");
  await client.end();

  if (!result.rows[0]?.ok) {
    throw new Error(`${label} query failed.`);
  }

  console.log(`OK   ${label} connection query passed.`);
}

async function checkRedis(connectionString) {
  const redis = new IORedis(connectionString, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
  });

  const response = await redis.ping();
  await redis.quit();

  if (response !== "PONG") {
    throw new Error(`Redis ping failed (${response}).`);
  }

  console.log("OK   REDIS_URL ping returned PONG.");
}

async function run() {
  console.log("HackScout runtime dependency check");
  await checkPostgres("DATABASE_URL", databaseUrl);
  if (directUrl) {
    await checkPostgres("DIRECT_URL", directUrl);
  } else {
    console.log("WARN DIRECT_URL missing: migrate deploy may fail in production.");
  }
  await checkRedis(redisUrl);
  console.log("\nPass: DB and Redis connectivity checks completed.");
}

run().catch((error) => {
  console.error(`\nFail: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
