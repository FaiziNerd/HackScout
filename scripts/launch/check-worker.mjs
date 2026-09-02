#!/usr/bin/env node

import "dotenv/config";
import { Queue } from "bullmq";
import IORedis from "ioredis";

const SCRAPER_QUEUE_NAME = "event-scrapers";
const RECENT_COMPLETION_MS = 24 * 60 * 60 * 1000;

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error("Missing REDIS_URL.");
  process.exit(1);
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
});

const queue = new Queue(SCRAPER_QUEUE_NAME, { connection });

async function getRecentCompletionAgeMs() {
  const completed = await queue.getJobs(["completed"], 0, 0, false);
  const latest = completed[0];

  if (!latest?.finishedOn) {
    return null;
  }

  return Date.now() - latest.finishedOn;
}

async function run() {
  console.log("HackScout worker readiness check");

  const [workers, active, waiting, schedulers, recentCompletionAgeMs] = await Promise.all([
    queue.getWorkers(),
    queue.getActiveCount(),
    queue.getWaitingCount(),
    queue.getJobSchedulers(),
    getRecentCompletionAgeMs(),
  ]);

  if (schedulers.length === 0) {
    throw new Error("No 6-hour scraper scheduler registered in Redis.");
  }

  const scheduler = schedulers[0];
  console.log(`OK   scraper scheduler registered (${scheduler.pattern ?? "unknown pattern"}).`);

  const workerConnected = workers.length > 0;
  const workerProcessing = active > 0;
  const workerRecentlyCompleted =
    recentCompletionAgeMs !== null && recentCompletionAgeMs <= RECENT_COMPLETION_MS;

  if (workerConnected) {
    console.log(
      `OK   ${workers.length} worker(s) connected: ${workers.map((worker) => worker.name).join(", ")}`,
    );
  } else if (workerProcessing) {
    console.log(`OK   scraper job in progress (${active} active).`);
  } else if (workerRecentlyCompleted) {
    const hours = Math.round(recentCompletionAgeMs / (60 * 60 * 1000));
    console.log(`OK   scraper job completed within the last ${hours || 1} hour(s).`);
  } else if (waiting > 0) {
    throw new Error(
      `${waiting} scraper job(s) waiting with no active worker. Deploy Render worker (\`npm run worker\`) and set DATABASE_URL, DIRECT_URL, REDIS_URL.`,
    );
  } else {
    throw new Error(
      'No worker activity detected. Deploy Render worker (`npm run worker`) and confirm logs show: worker listening on "event-scrapers".',
    );
  }

  console.log(`Info active jobs: ${active}, waiting jobs: ${waiting}`);
  console.log("\nPass: scraper queue has a registered schedule and worker activity.");
}

run()
  .catch((error) => {
    console.error(`\nFail: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  })
  .finally(async () => {
    await queue.close();
    await connection.quit();
  });
