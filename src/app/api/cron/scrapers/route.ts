import { NextResponse } from "next/server";

import { closeScraperQueue, enqueueRunAllScrapers } from "@/lib/scraper-queue";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await enqueueRunAllScrapers("cron");
    return NextResponse.json({
      ok: true,
      skipped: result.skipped,
      jobId: result.jobId ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scraper enqueue failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    await closeScraperQueue();
  }
}
