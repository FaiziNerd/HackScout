import { NextResponse } from "next/server";

import { sendWeeklyDigests } from "@/lib/weekly-digest";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await sendWeeklyDigests();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Weekly digest run failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
