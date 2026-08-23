import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminUser } from "@/lib/admin";
import { resolveMissingEventReport } from "@/lib/missing-events";

const bodySchema = z.object({
  action: z.enum(["approve", "reject"]),
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
    const report = await resolveMissingEventReport(
      id,
      body.action === "approve" ? "approved" : "rejected",
    );
    return NextResponse.json({ ok: true, reviewStatus: report.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review failed.";
    const status = message === "Tip not found." ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
