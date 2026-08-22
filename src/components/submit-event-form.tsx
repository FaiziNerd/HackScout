"use client";

import { ArrowRight, CheckCircle, MagnifyingGlass, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { FormFieldBuilder } from "@/components/form-field-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_REGISTRATION_FIELDS, type RegistrationFormField } from "@/lib/registration-form";

const labelClass =
  "block font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-foreground";
const fieldClass =
  "mt-2 h-12 rounded-none border-2 border-foreground bg-card px-3 text-base focus-visible:border-primary focus-visible:ring-0 md:text-sm";
const selectClass =
  "mt-2 h-12 w-full rounded-none border-2 border-foreground bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

export type SubmitCityOption = {
  slug: string;
  name: string;
  province?: string | null;
  isVirtual?: boolean;
};

export function SubmitEventForm({ cities }: { cities: SubmitCityOption[] }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [registrationType, setRegistrationType] = useState<"external" | "native">("external");
  const [formFields, setFormFields] = useState<RegistrationFormField[]>(DEFAULT_REGISTRATION_FIELDS);
  const [citySlug, setCitySlug] = useState(cities.find((city) => city.slug === "karachi")?.slug || cities[0]?.slug || "online");
  const [cityQuery, setCityQuery] = useState("");
  const [cityOpen, setCityOpen] = useState(false);

  const filteredCities = useMemo(() => {
    const query = cityQuery.trim().toLowerCase();
    if (!query) return cities;
    return cities.filter((city) => {
      const haystack = `${city.name} ${city.province ?? ""} ${city.slug}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [cities, cityQuery]);

  const selectedCity = cities.find((city) => city.slug === citySlug);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      title: String(formData.get("title") || ""),
      organizerName: String(formData.get("organizerName") || ""),
      category: String(formData.get("category") || "hackathon"),
      citySlug,
      customCityName: String(formData.get("customCityName") || "") || undefined,
      venue: String(formData.get("venue") || "") || undefined,
      prizePool: String(formData.get("prizePool") || "") || undefined,
      startDate: String(formData.get("startDate") || ""),
      endDate: String(formData.get("endDate") || "") || undefined,
      registrationDeadline: String(formData.get("registrationDeadline") || ""),
      registrationType,
      registrationUrl: String(formData.get("registrationUrl") || ""),
      formFields: registrationType === "native" ? formFields : undefined,
      description: String(formData.get("description") || ""),
    };

    try {
      const response = await fetch("/api/events/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Submit failed");

      setStatus("success");
      setMessage(data.message);
      form.reset();
      setRegistrationType("external");
      setFormFields(DEFAULT_REGISTRATION_FIELDS);
      setCityQuery("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Submit failed");
    }
  }

  return (
    <section aria-labelledby="submission-form-title" className="border-2 border-foreground bg-card">
      <div className="grid border-b-2 border-foreground sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="p-5 sm:p-7">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Community wire / new record
          </p>
          <h2
            id="submission-form-title"
            className="mt-2 font-heading text-4xl font-semibold tracking-[-0.04em]"
          >
            Event filing sheet
          </h2>
        </div>
        <div className="border-t border-foreground px-5 py-4 font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground sm:border-l sm:border-t-0 sm:px-7">
          Fields marked * are required
        </div>
      </div>

      <form className="divide-y divide-foreground/35" onSubmit={handleSubmit}>
        <fieldset className="grid gap-5 p-5 sm:p-7">
          <legend className="sr-only">Event identity</legend>
          <div>
            <label htmlFor="title" className={labelClass}>
              01 / Event title <span className="text-primary">*</span>
            </label>
            <Input
              id="title"
              name="title"
              type="text"
              required
              minLength={3}
              placeholder="FAST National Hackathon 2026"
              className={fieldClass}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="organizerName" className={labelClass}>
                02 / Organizer or society <span className="text-primary">*</span>
              </label>
              <Input
                id="organizerName"
                name="organizerName"
                type="text"
                required
                placeholder="ACM FAST / GDG Islamabad"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="category" className={labelClass}>
                03 / Format <span className="text-primary">*</span>
              </label>
              <select id="category" name="category" required className={selectClass}>
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
        </fieldset>

        <fieldset className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <legend className="sr-only">Location</legend>
          <div>
            <label htmlFor="citySearch" className={labelClass}>
              04 / City or location <span className="text-primary">*</span>
            </label>
            <div className="relative mt-2">
              <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="citySearch"
                type="search"
                autoComplete="off"
                value={
                  cityOpen
                    ? cityQuery
                    : citySlug === "other"
                      ? "City not listed"
                      : selectedCity
                        ? cityLabel(selectedCity)
                        : cityQuery
                }
                onChange={(event) => {
                  setCityQuery(event.target.value);
                  setCityOpen(true);
                }}
                onFocus={() => {
                  setCityOpen(true);
                  setCityQuery("");
                }}
                onBlur={() => {
                  window.setTimeout(() => setCityOpen(false), 120);
                }}
                placeholder="Search Karachi, Lahore, Online…"
                className="h-12 w-full rounded-none border-2 border-foreground bg-card pr-3 pl-10 text-sm outline-none focus:border-primary"
              />
              {cityOpen ? (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto border-2 border-foreground bg-card">
                  {filteredCities.map((city) => (
                    <li key={city.slug}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setCitySlug(city.slug);
                          setCityQuery("");
                          setCityOpen(false);
                        }}
                      >
                        {cityLabel(city)}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      className="w-full border-t border-foreground px-3 py-2 text-left text-sm font-semibold hover:bg-muted"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setCitySlug("other");
                        setCityQuery("");
                        setCityOpen(false);
                      }}
                    >
                      City not listed
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>
            {citySlug === "other" ? (
              <div className="mt-4">
                <label htmlFor="customCityName" className={labelClass}>
                  City name <span className="text-primary">*</span>
                </label>
                <Input
                  id="customCityName"
                  name="customCityName"
                  type="text"
                  required
                  minLength={2}
                  placeholder="Gilgit / Jhang / Chitral"
                  className={fieldClass}
                />
              </div>
            ) : null}
          </div>
          <div>
            <label htmlFor="venue" className={labelClass}>
              05 / Venue or online platform
            </label>
            <Input
              id="venue"
              name="venue"
              type="text"
              placeholder="FAST Main Campus / Zoom"
              className={fieldClass}
            />
          </div>
        </fieldset>

        <fieldset className="grid gap-5 p-5 sm:grid-cols-3 sm:p-7">
          <legend className="sr-only">Dates</legend>
          <div>
            <label htmlFor="startDate" className={labelClass}>
              06 / Start <span className="text-primary">*</span>
            </label>
            <Input id="startDate" name="startDate" type="date" required className={fieldClass} />
          </div>
          <div>
            <label htmlFor="endDate" className={labelClass}>
              07 / End
            </label>
            <Input id="endDate" name="endDate" type="date" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="registrationDeadline" className={labelClass}>
              08 / Deadline <span className="text-primary">*</span>
            </label>
            <Input
              id="registrationDeadline"
              name="registrationDeadline"
              type="date"
              required
              className={fieldClass}
            />
          </div>
        </fieldset>

        <fieldset className="grid gap-5 p-5 sm:p-7">
          <legend className="sr-only">Registration details</legend>
          <div>
            <p className={labelClass}>
              09 / How people register <span className="text-primary">*</span>
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["external", "External link", "Send people to Devfolio, Luma or a Google Form."],
                  ["native", "HackScout form", "Build questions here. Submissions stay in your table."],
                ] as const
              ).map(([value, title, hint]) => (
                <label
                  key={value}
                  className={`cursor-pointer border-2 p-4 ${
                    registrationType === value ? "border-primary bg-muted" : "border-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="registrationType"
                    value={value}
                    checked={registrationType === value}
                    onChange={() => setRegistrationType(value)}
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
                </label>
              ))}
            </div>
          </div>
          {registrationType === "external" ? (
            <div>
              <label htmlFor="registrationUrl" className={labelClass}>
                Official registration URL <span className="text-primary">*</span>
              </label>
              <Input
                id="registrationUrl"
                name="registrationUrl"
                type="url"
                required
                placeholder="https://forms.gle/... or https://lu.ma/..."
                className={fieldClass}
              />
            </div>
          ) : (
            <div>
              <p className={labelClass}>Signup questions</p>
              <p className="mt-1 mb-3 text-xs text-muted-foreground">
                Name and email stay required. Add university, team, GitHub or your own prompts.
              </p>
              <FormFieldBuilder fields={formFields} onChange={setFormFields} />
            </div>
          )}
          <div>
            <label htmlFor="prizePool" className={labelClass}>
              Prize pool
            </label>
            <Input
              id="prizePool"
              name="prizePool"
              type="text"
              placeholder="PKR 500,000 / internships / swag"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>
              10 / What happens at this event <span className="text-primary">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              minLength={20}
              rows={5}
              placeholder="Tracks, prize pool, team size, eligibility and anything applicants should know…"
              className="mt-2 w-full resize-y rounded-none border-2 border-foreground bg-card p-3 text-base outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 md:text-sm"
            />
          </div>
        </fieldset>

        <div className="p-5 sm:p-7">
          {message && (
            <div
              role="status"
              aria-live="polite"
              className={`mb-5 flex items-start gap-3 border-2 p-4 text-sm ${
                status === "success"
                  ? "border-foreground bg-accent text-accent-foreground"
                  : "border-destructive bg-destructive/10 text-destructive"
              }`}
            >
              {status === "success" ? (
                <CheckCircle className="mt-0.5 size-5 shrink-0" weight="fill" />
              ) : (
                <WarningCircle className="mt-0.5 size-5 shrink-0" weight="fill" />
              )}
              {message}
            </div>
          )}

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <CheckCircle className="size-5 shrink-0 text-primary" weight="bold" />
              <span>Reviewed within 24 hours and published after verification.</span>
            </div>
            <Button
              type="submit"
              disabled={status === "loading"}
              className="editorial-shadow h-12 rounded-none border border-foreground bg-primary px-6 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand-hover"
            >
              {status === "loading" ? "Filing…" : "File event listing"}
              {status === "loading" ? <PaperPlaneTilt className="animate-pulse" /> : <ArrowRight />}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}

function cityLabel(city: SubmitCityOption) {
  return `${city.name}${city.province ? ` (${city.province})` : ""}`;
}

export function SubmitPageHero() {
  return (
    <header className="border-b-2 border-foreground pt-[4.5rem]">
      <div className="relative mx-auto max-w-[1500px] overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
        <div aria-hidden className="paper-grid absolute inset-0 opacity-35" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-end">
          <div>
            <div className="border-y border-foreground py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Open desk / community submissions
            </div>
            <h1 className="mt-8 max-w-[11ch] font-heading text-[clamp(4rem,9vw,8rem)] font-medium leading-[0.78] tracking-[-0.06em]">
              Put it on
              <span className="block italic text-primary">the radar.</span>
            </h1>
          </div>
          <p className="border-l-4 border-primary pl-4 text-sm font-medium leading-relaxed">
            Submit a hackathon, meetup, conference or campus competition from anywhere in Pakistan.
            Listing is free and every link is checked before it goes live.
          </p>
        </div>
      </div>
    </header>
  );
}
