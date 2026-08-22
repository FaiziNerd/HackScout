import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminUser } from "@/lib/admin";
import { approveEvent, rejectEvent } from "@/lib/submissions";

const bodySchema = z.object({
  action: z.enum(["approve", "reject"]),
  cityId: z.string().optional(),
});

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteProps) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = bodySchema.parse(await request.json());
    if (body.action === "approve") {
      const event = await approveEvent(id, body.cityId);
      return NextResponse.json({ ok: true, reviewStatus: event.reviewStatus });
    }
    const event = await rejectEvent(id);
    return NextResponse.json({ ok: true, reviewStatus: event.reviewStatus });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review failed.";
    const status = message === "Event not found." ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
