import { NextResponse } from "next/server";

import { ensureAppUser, getAuthUser } from "@/lib/auth";
import { trackExternalRegistrationClick } from "@/lib/events";
import { submitNativeRegistration } from "@/lib/registrations";

interface RegisterRouteProps {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RegisterRouteProps) {
  const { slug } = await params;
  const destination = await trackExternalRegistrationClick(slug);

  if (!destination) {
    return NextResponse.redirect(new URL(`/events/${slug}`, _request.url));
  }

  return NextResponse.redirect(destination, 302);
}

export async function POST(request: Request, { params }: RegisterRouteProps) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ ok: false, error: "Sign in to register." }, { status: 401 });
  }

  const { slug } = await params;

  try {
    await ensureAppUser(authUser);
    const body = (await request.json()) as Record<string, unknown>;
    await submitNativeRegistration(slug, authUser, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    const status = message.includes("already") ? 409 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
