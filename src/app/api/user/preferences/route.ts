import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureAppUser, getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const preferencesSchema = z.object({
  cityIds: z.array(z.string().min(1)).max(20),
});

function errorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || "Check your digest preferences.";
  }
  if (error instanceof Error) return error.message;
  return "Could not update digest preferences.";
}

export async function POST(request: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ ok: false, error: "Sign in to update digest preferences." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { cityIds } = preferencesSchema.parse(body);
    const uniqueCityIds = Array.from(new Set(cityIds));

    const cities = uniqueCityIds.length
      ? await prisma.city.findMany({
          where: { id: { in: uniqueCityIds } },
          select: { id: true },
        })
      : [];

    if (cities.length !== uniqueCityIds.length) {
      return NextResponse.json({ ok: false, error: "Choose cities from the list." }, { status: 400 });
    }

    await ensureAppUser(authUser);
    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: { preferredCityIds: uniqueCityIds },
      select: { preferredCityIds: true },
    });

    return NextResponse.json({ ok: true, cityIds: user.preferredCityIds });
  } catch (error) {
    return NextResponse.json({ ok: false, error: errorMessage(error) }, { status: 400 });
  }
}
