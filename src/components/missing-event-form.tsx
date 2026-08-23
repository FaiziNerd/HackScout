"use client";

import { ArrowRight, CheckCircle, MagnifyingGlass, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAKISTAN_CITIES } from "@/lib/cities";

const labelClass =
  "block font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-foreground";
const fieldClass =
  "mt-2 h-12 rounded-none border-2 border-foreground bg-card px-3 text-base focus-visible:border-primary focus-visible:ring-0 md:text-sm";

type CityOption = {
  slug: string;
  name: string;
  province?: string;
};

function cityLabel(city: CityOption) {
  return `${city.name}${city.province ? ` (${city.province})` : ""}`;
}

export function MissingEventForm({
  compact = false,
  onSuccess,
}: {
  compact?: boolean;
  onSuccess?: () => void;
}) {
  const pathname = usePathname();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [citySlug, setCitySlug] = useState("karachi");
  const [cityQuery, setCityQuery] = useState("");
  const [cityOpen, setCityOpen] = useState(false);

  const cities = PAKISTAN_CITIES;
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
      citySlug,
      customCityName: String(formData.get("customCityName") || "") || undefined,
      sourceUrl: String(formData.get("sourceUrl") || "") || undefined,
      description: String(formData.get("description") || "") || undefined,
      pagePath: pathname || undefined,
    };

    try {
      const response = await fetch("/api/events/missing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not send this tip.");

      setStatus("success");
      setMessage(data.message);
      form.reset();
      setCityQuery("");
      onSuccess?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not send this tip.");
    }
  }

  return (
    <form className={compact ? "space-y-5" : "divide-y divide-foreground/35"} onSubmit={handleSubmit}>
      <div className={compact ? "space-y-5" : "grid gap-5 p-5 sm:p-7"}>
        <div>
          <label htmlFor="missing-title" className={labelClass}>
            01 / Event name <span className="text-primary">*</span>
          </label>
          <Input
            id="missing-title"
            name="title"
            type="text"
            required
            minLength={3}
            placeholder="NUST AI Summit / GDG Karachi meetup"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="missing-city" className={labelClass}>
            02 / City <span className="text-primary">*</span>
          </label>
          <div className="relative mt-2">
            <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="missing-city"
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
              <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto border-2 border-foreground bg-card">
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
              <label htmlFor="missing-custom-city" className={labelClass}>
                City name <span className="text-primary">*</span>
              </label>
              <Input
                id="missing-custom-city"
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
          <label htmlFor="missing-url" className={labelClass}>
            03 / Link to the post or signup
          </label>
          <Input
            id="missing-url"
            name="sourceUrl"
            type="url"
            placeholder="https://lu.ma/… or a LinkedIn / Facebook post"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="missing-note" className={labelClass}>
            04 / What did we miss?
          </label>
          <textarea
            id="missing-note"
            name="description"
            rows={compact ? 4 : 5}
            placeholder="Where you saw it, dates if you remember, or who is organising it…"
            className="mt-2 w-full resize-y rounded-none border-2 border-foreground bg-card p-3 text-base outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 md:text-sm"
          />
          <p className="mt-2 text-xs text-muted-foreground">Send a link, a note, or both.</p>
        </div>
      </div>

      <div className={compact ? "pt-1" : "p-5 sm:p-7"}>
        {message ? (
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
        ) : null}

        <Button
          type="submit"
          disabled={status === "loading"}
          className="editorial-shadow h-12 w-full rounded-none border border-foreground bg-primary px-6 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand-hover"
        >
          {status === "loading" ? "Sending…" : "Send the tip"}
          {status === "loading" ? <PaperPlaneTilt className="animate-pulse" /> : <ArrowRight />}
        </Button>
      </div>
    </form>
  );
}
