import IORedis from "ioredis";
import { Queue } from "bullmq";

export const SCRAPER_QUEUE_NAME = "event-scrapers";
export const RUN_ALL_SCRAPERS_JOB = "run-all";
export const SCRAPER_SCHEDULER_ID = "run-all-every-6h";
export type ScraperJobName = typeof RUN_ALL_SCRAPERS_JOB | typeof SCRAPER_SCHEDULER_ID;
/** UTC: 00:00, 06:00, 12:00, 18:00. Matches the Vercel cron in vercel.json. */
export const SCRAPER_CRON_PATTERN = "0 */6 * * *";

export interface RunAllScrapersJobData {
  requestedBy: "cron" | "admin" | "cli";
  requestedAt: string;
}

export interface RunAllScrapersJobResult {
  sources: number;
  eventsFound: number;
  inserted: number;
  merged: number;
  failedSources: number;
}

export type EnqueueRunAllResult =
  | { skipped: false; jobId: string | undefined }
  | { skipped: true; jobId?: undefined };

function getRedisUrl() {
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error(
      "REDIS_URL is not set. BullMQ requires a Redis TCP/TLS URL, not Upstash REST credentials.",
    );
  }

  return url;
}

/**
 * Producers fail quickly when Redis is down. The worker connection must use
 * `maxRetriesPerRequest: null` so BullMQ can block on BRPOP.
 */
export function createRedisConnection(role: "producer" | "worker") {
  return new IORedis(getRedisUrl(), {
    maxRetriesPerRequest: role === "worker" ? null : 1,
    enableReadyCheck: true,
  });
}

const globalForQueue = globalThis as unknown as {
  scraperQueue?: Queue<RunAllScrapersJobData, RunAllScrapersJobResult, ScraperJobName>;
};

export function getScraperQueue() {
  if (!globalForQueue.scraperQueue) {
    globalForQueue.scraperQueue = new Queue<
      RunAllScrapersJobData,
      RunAllScrapersJobResult,
      ScraperJobName
    >(SCRAPER_QUEUE_NAME, {
      connection: createRedisConnection("producer"),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 30_000,
        },
        removeOnComplete: {
          age: 24 * 60 * 60,
          count: 100,
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60,
          count: 500,
        },
      },
    });
  }

  return globalForQueue.scraperQueue;
}

export async function hasInFlightScraperJob() {
  const queue = getScraperQueue();
  const [active, waiting] = await Promise.all([queue.getActiveCount(), queue.getWaitingCount()]);
  return active + waiting > 0;
}

/**
 * Enqueues a full scrape. Cron requests no-op when a run is already active or
 * waiting so the 6-hour worker scheduler and Vercel cron do not double-fire.
 */
export async function enqueueRunAllScrapers(
  requestedBy: RunAllScrapersJobData["requestedBy"],
): Promise<EnqueueRunAllResult> {
  if (requestedBy === "cron" && (await hasInFlightScraperJob())) {
    return { skipped: true };
  }

  const job = await getScraperQueue().add(RUN_ALL_SCRAPERS_JOB, {
    requestedBy,
    requestedAt: new Date().toISOString(),
  });

  return { skipped: false, jobId: job.id };
}

/** Registers (or refreshes) the repeating 6-hour scrape job. Requires a running worker to promote it. */
export async function ensureScraperSchedule() {
  return getScraperQueue().upsertJobScheduler(
    SCRAPER_SCHEDULER_ID,
    {
      pattern: SCRAPER_CRON_PATTERN,
      tz: "UTC",
    },
    {
      name: RUN_ALL_SCRAPERS_JOB,
      data: {
        requestedBy: "cron",
        requestedAt: new Date().toISOString(),
      },
    },
  );
}

export async function closeScraperQueue() {
  if (!globalForQueue.scraperQueue) return;

  await globalForQueue.scraperQueue.close();
  globalForQueue.scraperQueue = undefined;
}
