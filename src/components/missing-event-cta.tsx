"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { openMissingEventReporter } from "@/lib/missing-event-ui";
import { cn } from "@/lib/utils";

type MissingEventCtaProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href?: string;
};

export function MissingEventCta({
  href = "/missing",
  className,
  children = "Missing an event?",
  onClick,
  ...props
}: MissingEventCtaProps) {
  return (
    <Link
      href={href}
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        openMissingEventReporter();
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
