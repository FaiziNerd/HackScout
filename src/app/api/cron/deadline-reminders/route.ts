import { NextResponse } from "next/server";

import { sendDueDeadlineReminders } from "@/lib/deadline-reminders";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await sendDueDeadlineReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deadline reminder run failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
