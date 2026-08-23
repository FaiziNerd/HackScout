"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface MissingReportActionsProps {
  reportId: string;
  reviewStatus: "pending" | "approved" | "rejected";
}

export function MissingReportActions({ reportId, reviewStatus }: MissingReportActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: "approve" | "reject") {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/admin/missing/${reportId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error || "Could not update this tip.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-5 space-y-3 border-t border-foreground/20 pt-4">
      <div className="flex flex-wrap gap-2">
        {reviewStatus !== "approved" ? (
          <button
            type="button"
            onClick={() => run("approve")}
            disabled={pending}
            className="inline-flex min-h-11 items-center bg-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-background hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
          >
            {pending ? "Working…" : "Mark logged"}
          </button>
        ) : null}
        {reviewStatus !== "rejected" ? (
          <button
            type="button"
            onClick={() => run("reject")}
            disabled={pending}
            className="inline-flex min-h-11 items-center border-2 border-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.14em] hover:bg-destructive hover:text-white disabled:opacity-50"
          >
            Dismiss
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
