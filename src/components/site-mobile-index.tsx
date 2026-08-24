"use client";

import { Dialog } from "@base-ui/react/dialog";
import { List, X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthNav } from "@/components/auth-nav";

const indexLinkClass =
  "flex min-h-14 items-center justify-between border-b border-foreground/30 px-1 text-sm font-semibold uppercase tracking-[0.14em] outline-none hover:bg-muted focus-visible:bg-muted";

export function SiteMobileIndex() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => setOpen(next)}>
      <Dialog.Trigger
        aria-label="Open contents"
        className="grid size-11 shrink-0 place-items-center border border-foreground bg-card text-foreground hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <List aria-hidden className="size-5" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-foreground/45 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-x-0 top-0 z-[90] max-h-[min(36rem,100dvh)] overflow-y-auto border-b-2 border-foreground bg-background px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))] shadow-[0_8px_0_0_var(--foreground)] outline-none transition duration-200 data-[ending-style]:-translate-y-3 data-[ending-style]:opacity-0 data-[starting-style]:-translate-y-3 data-[starting-style]:opacity-0 sm:px-6">
          <div className="mx-auto flex max-w-[1500px] items-start justify-between gap-4 border-b-2 border-foreground pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Issue 08.26 / Live edition
              </p>
              <Dialog.Title className="mt-1 font-heading text-3xl font-medium tracking-[-0.04em]">
                Contents
              </Dialog.Title>
            </div>
            <Dialog.Close
              aria-label="Close contents"
              className="grid size-11 shrink-0 place-items-center border border-foreground hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <X aria-hidden className="size-5" />
            </Dialog.Close>
          </div>

          <nav className="mx-auto mt-1 max-w-[1500px]" aria-label="Site">
            <Link href="/events" className={indexLinkClass}>
              Events
              <span className="font-mono text-[10px] font-normal tracking-[0.16em] text-muted-foreground">
                01
              </span>
            </Link>
            <Link href="/cities" className={indexLinkClass}>
              Cities
              <span className="font-mono text-[10px] font-normal tracking-[0.16em] text-muted-foreground">
                02
              </span>
            </Link>
            <Link href="/submit" className={indexLinkClass}>
              Submit an event
              <span className="font-mono text-[10px] font-normal tracking-[0.16em] text-muted-foreground">
                03
              </span>
            </Link>
            <AuthNav variant="panel" onNavigate={() => setOpen(false)} />
          </nav>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
