import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cities",
};

export default function CitiesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Cities</h1>
      <p className="mt-2 text-muted-foreground">
        Per-city pages land after the Prisma schema and seed data.
      </p>
    </main>
  );
}
