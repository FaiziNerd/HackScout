import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit an event",
};

export default function SubmitPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Submit an event</h1>
      <p className="mt-2 text-muted-foreground">
        Community submit form is scheduled after auth and native registration.
      </p>
    </main>
  );
}
