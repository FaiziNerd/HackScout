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

const MAJOR_CITY_QUERIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Hyderabad",
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

/**
 * Smaller query set for WAF-sensitive sources (Unstop, HackerEarth).
 * Major cities + universities only — not every seeded town.
 */
export const FOCUSED_PAKISTAN_SEARCH_QUERIES: string[] = [
  "Pakistan",
  ...MAJOR_CITY_QUERIES,
  ...UNIVERSITY_QUERIES,
];
