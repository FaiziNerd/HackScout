"use client";

import { ArrowRight, CheckCircle, LinkSimple, MagicWand, WarningCircle } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SubmitCityOption } from "@/components/submit-event-form";
import type { LinkedInEventDraft } from "@/lib/linkedin-capture";

const labelClass =
  "block font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-foreground";
const fieldClass =
  "mt-2 h-12 rounded-none border-2 border-foreground bg-card px-3 text-base focus-visible:border-primary focus-visible:ring-0 md:text-sm";
const selectClass =
  "mt-2 h-12 w-full rounded-none border-2 border-foreground bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

type CaptureStatus = "idle" | "extracting" | "ready" | "submitting" | "success" | "error";

const emptyDraft: LinkedInEventDraft = {
  title: "",
  description: "",
  category: "other",
  citySlug: "karachi",
  venue: "",
  startDate: "",
  endDate: "",
  registrationDeadline: "",
  registrationUrl: "",
  organizerName: "",
  prizePool: "",
  sourcePostUrl: "",
  confidenceNotes: [],
};

export function LinkedInCaptureForm({ cities }: { cities: SubmitCityOption[] }) {
  const [postUrl, setPostUrl] = useState("");
  const [postText, setPostText] = useState("");
  const [draft, setDraft] = useState<LinkedInEventDraft>(emptyDraft);
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");

  const selectedCity = useMemo(
    () => cities.find((city) => city.slug === draft.citySlug) || cities[0],
    [cities, draft.citySlug]
  );

  async function handleExtract() {
    setStatus("extracting");
    setMessage("");
    setWarning("");

    try {
      const response = await fetch("/api/events/linkedin/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postUrl, postText }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not extract this post.");

      setDraft({
        ...emptyDraft,
        ...data.draft,
        citySlug: cities.some((city) => city.slug === data.draft.citySlug) ? data.draft.citySlug : "karachi",
      });
      setWarning(data.warning || "");
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not extract this post.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") || ""),
      organizerName: String(formData.get("organizerName") || ""),
      category: String(formData.get("category") || "other"),
      citySlug: String(formData.get("citySlug") || selectedCity?.slug || "karachi"),
      venue: String(formData.get("venue") || "") || undefined,
      prizePool: String(formData.get("prizePool") || "") || undefined,
      startDate: String(formData.get("startDate") || ""),
      endDate: String(formData.get("endDate") || "") || undefined,
      registrationDeadline: String(formData.get("registrationDeadline") || ""),
      registrationType: "external",
      registrationUrl: String(formData.get("registrationUrl") || ""),
      description: String(formData.get("description") || ""),
      source: "linkedin",
      sourcePostUrl: String(formData.get("sourcePostUrl") || "") || undefined,
    };

    try {
      const response = await fetch("/api/events/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Submit failed.");

      setStatus("success");
      setMessage(data.message);
      setDraft(emptyDraft);
      setPostUrl("");
      setPostText("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Submit failed.");
    }
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="h-fit border-2 border-foreground bg-card">
        <div className="border-b-2 border-foreground p-5 sm:p-7">
          <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            <LinkSimple className="size-4" />
            LinkedIn capture
          </p>
          <h2 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.04em]">
            Paste the signal.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Use a public LinkedIn post URL, or paste the post text when LinkedIn asks for login.
          </p>
        </div>

        <div className="grid gap-5 p-5 sm:p-7">
          <div>
            <label htmlFor="postUrl" className={labelClass}>
              LinkedIn post URL
            </label>
            <Input
              id="postUrl"
              type="url"
              value={postUrl}
              onChange={(event) => setPostUrl(event.target.value)}
              placeholder="https://www.linkedin.com/posts/..."
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="postText" className={labelClass}>
              Or copied post text
            </label>
            <textarea
              id="postText"
              value={postText}
              onChange={(event) => setPostText(event.target.value)}
              rows={9}
              placeholder="Paste the LinkedIn announcement, caption, dates and registration link here."
              className="mt-2 w-full resize-y rounded-none border-2 border-foreground bg-card p-3 text-base outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 md:text-sm"
            />
          </div>
          <Button
            type="button"
            disabled={status === "extracting" || (!postUrl.trim() && !postText.trim())}
            onClick={handleExtract}
            className="editorial-shadow h-12 rounded-none border border-foreground bg-primary px-6 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand-hover"
          >
            {status === "extracting" ? "Extracting..." : "Extract draft"}
            <MagicWand className={status === "extracting" ? "animate-pulse" : ""} />
          </Button>

          {warning ? (
            <StatusBox kind="warning">
              {warning} Extraction continued with the text you pasted.
            </StatusBox>
          ) : null}
          {message && (status === "error" || status === "success") ? (
            <StatusBox kind={status === "success" ? "success" : "error"}>{message}</StatusBox>
          ) : null}
        </div>
      </div>

      <form
        key={`${draft.sourcePostUrl}-${draft.title}-${draft.startDate}`}
        className="border-2 border-foreground bg-card"
        onSubmit={handleSubmit}
      >
        <div className="border-b-2 border-foreground p-5 sm:p-7">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Review before filing
          </p>
          <h2 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.04em]">
            Extracted event sheet
          </h2>
        </div>

        <div className="grid gap-5 p-5 sm:p-7">
          {draft.confidenceNotes.length > 0 ? (
            <div className="border-2 border-primary bg-primary/10 p-4 text-sm">
              <p className="font-semibold">Check these fields before filing:</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                {draft.confidenceNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <label htmlFor="title" className={labelClass}>
              Event title <span className="text-primary">*</span>
            </label>
            <Input id="title" name="title" required minLength={3} defaultValue={draft.title} className={fieldClass} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="organizerName" className={labelClass}>
                Organizer <span className="text-primary">*</span>
              </label>
              <Input
                id="organizerName"
                name="organizerName"
                required
                minLength={2}
                defaultValue={draft.organizerName}
                placeholder="Organizer or society"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="category" className={labelClass}>
                Format <span className="text-primary">*</span>
              </label>
              <select id="category" name="category" required defaultValue={draft.category} className={selectClass}>
                <option value="hackathon">Hackathon</option>
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="meetup">Meetup</option>
                <option value="competition">Competition / Olympiad</option>
                <option value="seminar">Seminar / Webinar</option>
                <option value="career_fair">Career fair</option>
                <option value="festival">Festival</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="citySlug" className={labelClass}>
                City <span className="text-primary">*</span>
              </label>
              <select id="citySlug" name="citySlug" required defaultValue={draft.citySlug} className={selectClass}>
                {cities.map((city) => (
                  <option key={city.slug} value={city.slug}>
                    {city.name}
                    {city.province ? ` (${city.province})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="venue" className={labelClass}>
                Venue
              </label>
              <Input id="venue" name="venue" defaultValue={draft.venue} placeholder="Campus / hall / online" className={fieldClass} />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="startDate" className={labelClass}>
                Start <span className="text-primary">*</span>
              </label>
              <Input id="startDate" name="startDate" type="date" required defaultValue={draft.startDate} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="endDate" className={labelClass}>
                End
              </label>
              <Input id="endDate" name="endDate" type="date" defaultValue={draft.endDate} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="registrationDeadline" className={labelClass}>
                Deadline <span className="text-primary">*</span>
              </label>
              <Input
                id="registrationDeadline"
                name="registrationDeadline"
                type="date"
                required
                defaultValue={draft.registrationDeadline}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="registrationUrl" className={labelClass}>
              Registration URL <span className="text-primary">*</span>
            </label>
            <Input
              id="registrationUrl"
              name="registrationUrl"
              type="url"
              required
              defaultValue={draft.registrationUrl}
              placeholder="Official form, Luma, Eventbrite or website link"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="sourcePostUrl" className={labelClass}>
              Original LinkedIn post
            </label>
            <Input
              id="sourcePostUrl"
              name="sourcePostUrl"
              type="url"
              defaultValue={draft.sourcePostUrl || postUrl}
              placeholder="https://www.linkedin.com/posts/..."
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="prizePool" className={labelClass}>
              Prize pool
            </label>
            <Input id="prizePool" name="prizePool" defaultValue={draft.prizePool} placeholder="PKR 500,000 / swag" className={fieldClass} />
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Description <span className="text-primary">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              minLength={20}
              rows={6}
              defaultValue={draft.description}
              className="mt-2 w-full resize-y rounded-none border-2 border-foreground bg-card p-3 text-base outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 md:text-sm"
            />
          </div>

          <div className="flex flex-col gap-5 border-t border-foreground/35 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Saved as LinkedIn source and held for admin review before publishing.
            </p>
            <Button
              type="submit"
              disabled={status === "submitting" || status === "extracting"}
              className="editorial-shadow h-12 rounded-none border border-foreground bg-primary px-6 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand-hover"
            >
              {status === "submitting" ? "Filing..." : "File LinkedIn event"}
              <ArrowRight />
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}

function StatusBox({ kind, children }: { kind: "success" | "error" | "warning"; children: React.ReactNode }) {
  const success = kind === "success";
  const warning = kind === "warning";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 border-2 p-4 text-sm ${
        success
          ? "border-foreground bg-accent text-accent-foreground"
          : warning
            ? "border-primary bg-primary/10 text-foreground"
            : "border-destructive bg-destructive/10 text-destructive"
      }`}
    >
      {success ? (
        <CheckCircle className="mt-0.5 size-5 shrink-0" weight="fill" />
      ) : (
        <WarningCircle className="mt-0.5 size-5 shrink-0" weight="fill" />
      )}
      <span>{children}</span>
    </div>
  );
}
