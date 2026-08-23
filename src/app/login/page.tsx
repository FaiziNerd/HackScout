import { Suspense } from "react";
import Link from "next/link";

import { LoginForm } from "@/components/login-form";
import { SiteHeader } from "@/components/site-header";

import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to HackScout with Google or email to save events and get deadline alerts.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-[1500px] flex-1 gap-10 px-4 pb-16 pt-[6.5rem] sm:px-6 lg:grid-cols-[minmax(0,28rem)_1fr] lg:px-10">
        <Suspense
          fallback={
            <div className="h-80 animate-pulse border-2 border-foreground bg-card" aria-hidden />
          }
        >
          <LoginForm />
        </Suspense>
        <aside className="h-fit border-y-2 border-foreground py-6 lg:sticky lg:top-24">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Why a desk pass
          </p>
          <ul className="mt-5 space-y-4 text-sm leading-relaxed">
            <li>Register on hosted events without leaving HackScout.</li>
            <li>Save listings you do not want to lose in the feed.</li>
            <li>Deadline emails land 3 days and 1 day before registration closes.</li>
            <li>
              Still browsing?{" "}
              <Link href="/events" className="font-semibold underline underline-offset-4">
                Open the index
              </Link>{" "}
              with no account.
            </li>
          </ul>
        </aside>
      </main>
    </div>
  );
}
