import Link from "next/link";
import { LockKey } from "@phosphor-icons/react/dist/ssr";

import { SiteHeader } from "@/components/site-header";
import { getAuthUser } from "@/lib/auth";

type AdminLockedProps = {
  title: string;
  nextPath: string;
};

export async function AdminLocked({ title, nextPath }: AdminLockedProps) {
  const user = await getAuthUser();
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pb-16 pt-[6.5rem] sm:px-6">
        <div className="border-2 border-foreground bg-card p-8">
          <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            <LockKey className="size-4" />
            Restricted desk
          </p>
          <h1 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.04em]">
            {title}
          </h1>
          {user ? (
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                Signed in as <code className="text-foreground">{user.email}</code>, but that
                address is not in the production <code>ADMIN_EMAILS</code> list.
              </p>
              <p>
                Add this exact email in Vercel → Environment Variables →{" "}
                <code>ADMIN_EMAILS</code>, redeploy, then refresh this page. No need to
                sign in again.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Sign in with an address listed in <code>ADMIN_EMAILS</code>. Prefer Google —
              magic links must be opened in the same browser that requested them.
            </p>
          )}
          {user ? (
            <form action="/auth/sign-out" method="post" className="mt-6 flex flex-wrap gap-4">
              <button type="submit" className="inline-flex min-h-11 items-center underline">
                Sign out and use a different email
              </button>
              <Link href={nextPath} className="inline-flex min-h-11 items-center underline">
                Refresh after updating ADMIN_EMAILS
              </Link>
            </form>
          ) : (
            <Link href={loginHref} className="mt-6 inline-flex min-h-11 items-center underline">
              Sign in
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
