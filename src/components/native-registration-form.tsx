"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RegistrationFormField } from "@/lib/registration-form";

const labelClass =
  "block font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-foreground";
const fieldClass =
  "mt-2 h-12 rounded-none border-2 border-foreground bg-card px-3 text-base focus-visible:border-primary focus-visible:ring-0 md:text-sm";

interface NativeRegistrationFormProps {
  slug: string;
  fields: RegistrationFormField[];
  signedIn: boolean;
  defaultEmail?: string;
  alreadyRegistered?: boolean;
}

export function NativeRegistrationForm({
  slug,
  fields,
  signedIn,
  defaultEmail,
  alreadyRegistered = false,
}: NativeRegistrationFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    alreadyRegistered ? "success" : "idle",
  );
  const [message, setMessage] = useState(
    alreadyRegistered ? "You are already on this roster." : "",
  );

  if (!signedIn) {
    return (
      <div className="mt-4 border-2 border-foreground bg-card p-4">
        <p className="text-sm font-semibold">On-site signup</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to file your details here — no Google Form copy-paste.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(`/events/${slug}`)}`}
          className="mt-4 flex min-h-12 items-center justify-center border-2 border-foreground bg-foreground px-4 text-sm font-semibold uppercase tracking-[0.12em] text-background hover:bg-primary hover:text-primary-foreground"
        >
          Sign in to register
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(
      [...formData.entries()].map(([key, value]) => [key, String(value)]),
    );

    try {
      const response = await fetch(`/api/events/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Could not submit registration.");
      }
      setStatus("success");
      setMessage("You’re on the roster. The organizer will see this in the submissions table.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not submit registration.");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-4 border-2 border-foreground bg-accent p-4 text-accent-foreground">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <CheckCircle className="size-5" weight="fill" />
          Registered
        </p>
        <p className="mt-2 text-sm">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-2 border-foreground bg-card">
      <div className="border-b-2 border-foreground px-4 py-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          On-site signup
        </p>
        <p className="mt-1 text-sm font-semibold">File your details with HackScout.</p>
      </div>
      <div className="space-y-4 p-4">
        {fields.map((field) => (
          <div key={field.id}>
            <label htmlFor={field.id} className={labelClass}>
              {field.label}
              {field.required ? <span className="text-primary"> *</span> : null}
            </label>
            {field.type === "textarea" ? (
              <textarea
                id={field.id}
                name={field.id}
                required={field.required}
                placeholder={field.placeholder}
                rows={4}
                className="mt-2 w-full resize-y rounded-none border-2 border-foreground bg-background p-3 text-sm outline-none focus:border-primary"
              />
            ) : field.type === "select" ? (
              <select
                id={field.id}
                name={field.id}
                required={field.required}
                defaultValue=""
                className="mt-2 h-12 w-full rounded-none border-2 border-foreground bg-background px-3 text-sm outline-none focus:border-primary"
              >
                <option value="" disabled>
                  Select
                </option>
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={field.id}
                name={field.id}
                type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                required={field.required}
                placeholder={field.placeholder}
                defaultValue={field.id === "email" ? defaultEmail : undefined}
                className={fieldClass}
              />
            )}
          </div>
        ))}

        {message ? (
          <p role="status" className="flex items-start gap-2 text-sm text-destructive">
            <WarningCircle className="mt-0.5 size-4 shrink-0" />
            {message}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={status === "loading"}
          className="h-12 w-full rounded-none border-2 border-foreground bg-foreground text-xs font-semibold uppercase tracking-[0.12em] text-background hover:bg-primary hover:text-primary-foreground"
        >
          {status === "loading" ? "Filing…" : "Submit registration"}
          <PaperPlaneTilt className="size-4" />
        </Button>
      </div>
    </form>
  );
}
