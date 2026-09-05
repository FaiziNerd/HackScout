import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { notifyOrganizerOfRegistration } from "@/lib/organizer-notify";
import {
  parseFormFields,
  registrationsToCsv,
  validateRegistrationPayload,
  type RegistrationFormField,
} from "@/lib/registration-form";
import { isRegistrationOpen } from "@/lib/events";

function asPayload(value: Prisma.JsonValue): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, typeof item === "string" ? item : String(item ?? "")]),
  );
}

export async function submitNativeRegistration(
  slug: string,
  user: { id: string; email: string },
  body: Record<string, unknown>,
) {
  const event = await prisma.event.findFirst({
    where: { slug, reviewStatus: "approved" },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      registrationType: true,
      registrationDeadline: true,
      formFields: true,
      organizerEmail: true,
    },
  });

  if (!event || event.registrationType !== "native") {
    throw new Error("This listing is not taking on-site signups.");
  }

  if (!isRegistrationOpen(event.registrationDeadline, event.status)) {
    throw new Error("Registration is closed.");
  }

  const fields = parseFormFields(event.formFields);
  const { email, payload } = validateRegistrationPayload(fields, {
    ...body,
    email: typeof body.email === "string" && body.email.trim() ? body.email : user.email,
  });

  let registration;
  try {
    registration = await prisma.registration.create({
      data: {
        eventId: event.id,
        userId: user.id,
        email,
        payload,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("You have already registered for this event.");
    }
    throw error;
  }

  if (event.organizerEmail) {
    const registrantName =
      typeof payload.name === "string"
        ? payload.name
        : typeof payload.fullName === "string"
          ? payload.fullName
          : undefined;
    try {
      await notifyOrganizerOfRegistration({
        organizerEmail: event.organizerEmail,
        eventTitle: event.title,
        eventSlug: event.slug,
        registrantEmail: email,
        registrantName,
      });
    } catch {
      // Never block the registrant if email delivery fails.
    }
  }

  return registration;
}

export async function getNativeEventsWithCounts() {
  return prisma.event.findMany({
    where: { registrationType: "native" },
    include: {
      city: { select: { name: true, slug: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getEventRegistrations(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      city: { select: { name: true, slug: true } },
      registrations: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!event) return null;

  const fields = parseFormFields(event.formFields);
  return {
    event,
    fields,
    rows: event.registrations.map((row) => ({
      id: row.id,
      email: row.email,
      createdAt: row.createdAt,
      payload: asPayload(row.payload),
    })),
  };
}

export function buildRegistrationsCsv(fields: RegistrationFormField[], rows: Awaited<
  NonNullable<Awaited<ReturnType<typeof getEventRegistrations>>>
>["rows"]) {
  return registrationsToCsv(fields, rows);
}

export function isOrganizerEmail(organizerEmail: string | null | undefined, userEmail: string) {
  if (!organizerEmail) return false;
  return organizerEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();
}
