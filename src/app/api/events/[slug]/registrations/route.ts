import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { getAuthUser } from "@/lib/auth";
import { buildRegistrationsCsv, getEventRegistrations, isOrganizerEmail } from "@/lib/registrations";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const data = await getEventRegistrations(slug);
  if (!data) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const admin = await getAdminUser();
  const user = admin ? null : await getAuthUser();
  const isOrganizer = Boolean(user && isOrganizerEmail(data.event.organizerEmail, user.email));

  if (!admin && !isOrganizer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const format = new URL(request.url).searchParams.get("format");
  if (format === "csv") {
    const csv = buildRegistrationsCsv(data.fields, data.rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}-registrations.csv"`,
      },
    });
  }

  return NextResponse.json({
    count: data.rows.length,
    fields: data.fields,
    rows: data.rows,
  });
}
