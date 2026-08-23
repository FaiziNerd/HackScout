"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  deadline: string | null;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function getTimeLeftFrom(deadlineIso: string, nowMs: number): TimeLeft {
  const diff = new Date(deadlineIso).getTime() - nowMs;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function CountdownTimer({ deadline, className }: CountdownTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [deadline]);

  if (!deadline) {
    return (
      <div className={cn("border-2 border-foreground bg-card p-5", className)}>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          Registration window
        </p>
        <p className="mt-3 font-heading text-4xl font-semibold tracking-[-0.04em]">Open</p>
        <p className="mt-2 text-sm text-muted-foreground">No closing time has been posted yet.</p>
      </div>
    );
  }

  const live = getTimeLeftFrom(deadline, now);
  const units = [
    { label: "Days", value: pad(live.days) },
    { label: "Hours", value: pad(live.hours) },
    { label: "Minutes", value: pad(live.minutes) },
    { label: "Seconds", value: pad(live.seconds) },
  ];

  return (
    <div
      className={cn("border-2 border-foreground bg-card p-5", className)}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={
        live.expired
          ? "Registration has closed"
          : `Registration closes in ${live.days} days, ${live.hours} hours, ${live.minutes} minutes, ${live.seconds} seconds`
      }
    >
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
        {live.expired ? "Deadline passed" : "Time left to register"}
      </p>

      {live.expired ? (
        <p className="mt-4 font-heading text-5xl font-semibold tracking-[-0.04em]">Closed</p>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
          {units.map((unit) => (
            <div key={unit.label} className="border border-foreground bg-background px-1 py-3 text-center">
              <span className="block font-heading text-3xl font-semibold leading-none tabular-nums tracking-[-0.04em] sm:text-4xl">
                {unit.value}
              </span>
              <span className="mt-2 block font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
        Closes{" "}
        {new Date(deadline).toLocaleString("en-PK", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}
