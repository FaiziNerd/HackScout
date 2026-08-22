import type { EventSource, EventStatus, RegistrationType } from "@/generated/prisma/client";

import { NativeRegistrationForm } from "@/components/native-registration-form";
import type { RegistrationFormField } from "@/lib/registration-form";
import {
  getExternalRegistrationUrl,
  getRegistrationCtaLabel,
  isRegistrationOpen,
} from "@/lib/events";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

interface RegistrationCtaProps {
  slug: string;
  source: EventSource;
  sourceUrl: string;
  registrationUrl: string | null;
  registrationType: RegistrationType;
  registrationDeadline: Date | null;
  status: EventStatus;
  formFields?: RegistrationFormField[];
  signedIn?: boolean;
  defaultEmail?: string | null;
  alreadyRegistered?: boolean;
}

export function RegistrationCta({
  slug,
  source,
  sourceUrl,
  registrationUrl,
  registrationType,
  registrationDeadline,
  status,
  formFields = [],
  signedIn = false,
  defaultEmail,
  alreadyRegistered = false,
}: RegistrationCtaProps) {
  const destination = getExternalRegistrationUrl({ registrationUrl, sourceUrl });
  const open = isRegistrationOpen(registrationDeadline, status);
  const label = getRegistrationCtaLabel(source);
  const trackedHref = `/api/events/${slug}/register`;

  if (!open) {
    return (
      <div className="mt-4">
        <p className="flex min-h-12 items-center justify-center border-2 border-foreground bg-muted px-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Registration closed
        </p>
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          This listing is no longer taking signups.
        </p>
      </div>
    );
  }

  if (registrationType === "native") {
    return (
      <NativeRegistrationForm
        slug={slug}
        fields={formFields}
        signedIn={signedIn}
        defaultEmail={defaultEmail ?? undefined}
        alreadyRegistered={alreadyRegistered}
      />
    );
  }

  if (!destination) {
    return (
      <div className="mt-4">
        <p className="flex min-h-12 items-center justify-center border-2 border-foreground bg-muted px-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          No signup link yet
        </p>
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          Check back when the organizer posts a registration URL.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <a
        href={trackedHref}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-12 items-center justify-between border-2 border-foreground bg-foreground px-4 text-sm font-semibold uppercase tracking-[0.12em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {label}
        <ArrowUpRight aria-hidden className="size-5" />
      </a>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
        Opens the official organizer page. We count the click, then send you through.
      </p>
    </div>
  );
}
