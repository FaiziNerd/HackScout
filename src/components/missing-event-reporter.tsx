"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { MissingEventForm } from "@/components/missing-event-form";
import { MISSING_EVENT_OPEN } from "@/lib/missing-event-ui";

const HIDDEN_PREFIXES = ["/admin", "/login", "/missing", "/submit"];

export function MissingEventReporter() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hideTrigger = HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(MISSING_EVENT_OPEN, onOpen);
    return () => window.removeEventListener(MISSING_EVENT_OPEN, onOpen);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => setOpen(next)}>
      {hideTrigger ? null : (
        <Dialog.Trigger
          className="fixed right-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[60] flex min-h-11 items-center gap-2 border-2 border-foreground bg-primary px-3 py-2 text-primary-foreground shadow-[4px_4px_0_0_var(--foreground)] transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:bottom-auto sm:top-1/2 sm:right-0 sm:min-h-0 sm:-translate-y-1/2 sm:flex-col sm:gap-3 sm:px-2 sm:py-5"
          aria-label="Missing an event? Tip the desk"
        >
          <span className="grid size-6 place-items-center border border-primary-foreground/70 font-mono text-[10px] font-semibold">
            ?
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] sm:hidden">
            Missing an event?
          </span>
          <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-[0.22em] sm:[writing-mode:vertical-rl] sm:rotate-180">
            Missing an event?
          </span>
        </Dialog.Trigger>
      )}

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-foreground/45 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-x-0 bottom-0 z-[90] flex max-h-[92dvh] flex-col border-2 border-foreground bg-background shadow-[-8px_0_0_0_var(--foreground)] outline-none transition duration-200 data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:w-[min(32rem,100vw)] sm:max-h-none sm:data-[ending-style]:translate-x-6 sm:data-[ending-style]:translate-y-0 sm:data-[starting-style]:translate-x-6 sm:data-[starting-style]:translate-y-0">
          <div className="flex items-start justify-between gap-4 border-b-2 border-foreground px-5 py-4 sm:px-6">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                Community wire / gap report
              </p>
              <Dialog.Title className="mt-1 font-heading text-3xl font-semibold tracking-[-0.04em]">
                Missing an event?
              </Dialog.Title>
              <Dialog.Description className="mt-2 max-w-[36ch] text-sm leading-relaxed text-muted-foreground">
                Tip the desk with a name, city, and a link or note. We verify before it goes live.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="grid size-11 shrink-0 place-items-center border-2 border-foreground hover:bg-foreground hover:text-background"
              aria-label="Close missing event form"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <MissingEventForm compact />
          </div>

          <p className="border-t-2 border-foreground px-5 py-4 text-xs text-muted-foreground sm:px-6">
            Have the full listing?{" "}
            <Link href="/submit" onClick={() => setOpen(false)} className="underline underline-offset-4 hover:text-primary">
              File it on /submit
            </Link>
            .
          </p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
