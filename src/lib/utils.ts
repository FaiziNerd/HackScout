import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const HTML_TAG_RE = /<\/?[a-zA-Z][^>]*>/g;

/** Strip markup/entities from scraped or user-supplied text. */
export function stripHtml(value?: string | null): string {
  if (!value) return "";

  const decoded = String(value)
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");

  return decoded.replace(HTML_TAG_RE, "").replace(/\s+/g, " ").trim();
}

/** Prize amounts from sources like Devpost arrive as `$<span data-currency-value>175</span>`. */
export function formatPrizePool(value?: string | null): string | null {
  const cleaned = stripHtml(value);
  return cleaned || null;
}
