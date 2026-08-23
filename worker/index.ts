import "dotenv/config";
import { Worker } from "bullmq";

import { prisma } from "@/lib/db";
import {
  closeScraperQueue,
  createRedisConnection,
  ensureScraperSchedule,
  RUN_ALL_SCRAPERS_JOB,
  SCRAPER_CRON_PATTERN,
  SCRAPER_QUEUE_NAME,
  type RunAllScrapersJobData,
  type RunAllScrapersJobResult,
} from "@/lib/scraper-queue";
import { runAllAndPersist, toRunAllScrapersJobResult } from "@/scrapers/run-all";

const connection = createRedisConnection("worker");

const worker = new Worker<
  RunAllScrapersJobData,
  RunAllScrapersJobResult,
  typeof RUN_ALL_SCRAPERS_JOB
>(
  SCRAPER_QUEUE_NAME,
  async (job) => {
    if (job.name !== RUN_ALL_SCRAPERS_JOB) {
      throw new Error(`Unsupported scraper job: ${job.name}`);
    }

    console.log(
      `[scrapers] starting run-all (requestedBy=${job.data.requestedBy}, jobId=${job.id})`,
    );

    const summaries = await runAllAndPersist();
    const result = toRunAllScrapersJobResult(summaries);

    for (const summary of summaries) {
      console.log(
        `[scrapers] ${summary.source}: ${summary.status} — found ${summary.eventsFound}, inserted ${summary.inserted}, merged ${summary.merged}, errors ${summary.errors.length}`,
      );
    }

    console.log(
      `[scrapers] finished sources=${result.sources} found=${result.eventsFound} inserted=${result.inserted} merged=${result.merged} failed=${result.failedSources}`,
    );

    return result;
  },
  {
    connection,
    concurrency: 1,
    lockDuration: 5 * 60 * 1000,
  },
);

worker.on("failed", (job, error) => {
  console.error(`[scrapers] job ${job?.id ?? "unknown"} failed:`, error);
});

worker.on("error", (error) => {
  console.error("[scrapers] worker error:", error);
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[scrapers] ${signal} received, closing worker`);

  try {
    await worker.close();
    await closeScraperQueue();
    await connection.quit();
    await prisma.$disconnect();
  } catch (error) {
    console.error("[scrapers] shutdown error:", error);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

async function main() {
  try {
    await ensureScraperSchedule();
    console.log(
      `[scrapers] worker listening on "${SCRAPER_QUEUE_NAME}" (schedule: ${SCRAPER_CRON_PATTERN} UTC)`,
    );
  } catch (error) {
    console.error("[scrapers] failed to register 6-hour schedule:", error);
    await shutdown("startup-error");
  }
}

void main();
