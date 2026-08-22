import { NextResponse } from "next/server";

import { ensureAppUser, getAuthUser } from "@/lib/auth";
import { getEventBySlug } from "@/lib/events";
import { toggleSavedEvent } from "@/lib/saved-events";

interface SaveRouteProps {
  params: Promise<{ slug: string }>;
}

export async function POST(_request: Request, { params }: SaveRouteProps) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Sign in to save events." }, { status: 401 });
  }

  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  await ensureAppUser(authUser);
  const result = await toggleSavedEvent(authUser.id, event.id);

  return NextResponse.json(result);
}
