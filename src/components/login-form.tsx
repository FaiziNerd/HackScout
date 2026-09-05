"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { EnvelopeSimple, GoogleLogo } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { safeNextPath } from "@/lib/auth-paths";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const ERROR_COPY: Record<string, string> = {
  missing_code: "That sign-in link is missing a code. Request a new one.",
  auth_callback:
    "Sign-in link could not be completed. Open the newest email link in the same browser, or use Continue with Google.",
  config: "Auth is not configured on this environment.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const errorKey = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "google">("idle");
  const [message, setMessage] = useState<string | null>(
    errorKey ? ERROR_COPY[errorKey] ?? "Sign-in failed. Try again." : null
  );

  async function signInWithGoogle() {
    setMessage(null);
    setStatus("google");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus("idle");
      setMessage(ERROR_COPY.config);
      return;
    }

    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("idle");
      setMessage(error.message);
    }
  }

  async function signInWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setStatus("sending");

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus("idle");
      setMessage(ERROR_COPY.config);
      return;
    }

    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("idle");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="border-2 border-foreground bg-card">
      <div className="border-b-2 border-foreground px-5 py-4 sm:px-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          Desk pass
        </p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.04em]">
          Sign in to save events.
        </h1>
        <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
          Google or a one-time email link. Browsing stays open — login is only for saves and alerts.
        </p>
      </div>

      <div className="space-y-5 px-5 py-6 sm:px-6">
        {message ? (
          <p className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {message}
          </p>
        ) : null}

        {status === "sent" ? (
          <p className="border-2 border-foreground bg-accent px-4 py-3 text-sm leading-relaxed text-accent-foreground">
            Check <span className="font-semibold">{email}</span> for a sign-in link. It expires
            shortly — open it on this device.
          </p>
        ) : (
          <>
            <Button
              type="button"
              onClick={signInWithGoogle}
              disabled={status !== "idle"}
              className="h-12 w-full rounded-none border-2 border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
            >
              <GoogleLogo aria-hidden weight="bold" />
              {status === "google" ? "Redirecting…" : "Continue with Google"}
            </Button>

            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <span className="h-px flex-1 bg-foreground/30" />
              or email
              <span className="h-px flex-1 bg-foreground/30" />
            </div>

            <form onSubmit={signInWithEmail} className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Work or university email
                </span>
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@university.edu.pk"
                  className="h-12 rounded-none border-foreground text-base"
                />
              </label>
              <Button
                type="submit"
                disabled={status !== "idle"}
                className="h-12 w-full rounded-none border-2 border-foreground"
              >
                <EnvelopeSimple aria-hidden />
                {status === "sending" ? "Sending link…" : "Email me a link"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
