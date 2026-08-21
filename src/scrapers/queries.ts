import { PAKISTAN_CITIES } from "@/lib/cities";

const UNIVERSITY_QUERIES = [
  "NUST",
  "FAST",
  "GIKI",
  "LUMS",
  "COMSATS",
  "IBA",
  "NED",
  "UET",
  "PUCIT",
  "ITU",
];

/**
 * Search terms for Devfolio, Devpost, and other platform scrapers.
 * Includes Pakistan, every seeded city name, and major university keywords.
 */
export const PAKISTAN_SEARCH_QUERIES: string[] = [
  "Pakistan",
  ...PAKISTAN_CITIES.filter((c) => !c.isVirtual).map((c) =>
    c.name.replace(/\s*\(.*\)\s*/g, "").trim()
  ),
  ...UNIVERSITY_QUERIES,
  "", // general / open search bucket
];
