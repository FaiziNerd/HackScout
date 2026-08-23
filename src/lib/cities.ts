export type CitySeed = {
  slug: string;
  name: string;
  province?: string;
  country?: string;
  isVirtual: boolean;
};

export const PAKISTAN_CITIES: CitySeed[] = [
  // Online / Virtual first-class pseudo-city
  { slug: "online", name: "Online / Virtual", province: undefined, country: "Pakistan", isVirtual: true },

  // Federal Capital
  { slug: "islamabad", name: "Islamabad", province: "Federal Capital", country: "Pakistan", isVirtual: false },

  // Sindh
  { slug: "karachi", name: "Karachi", province: "Sindh", country: "Pakistan", isVirtual: false },
  { slug: "hyderabad", name: "Hyderabad", province: "Sindh", country: "Pakistan", isVirtual: false },
  { slug: "sukkur", name: "Sukkur", province: "Sindh", country: "Pakistan", isVirtual: false },
  { slug: "larkana", name: "Larkana", province: "Sindh", country: "Pakistan", isVirtual: false },
  { slug: "nawabshah", name: "Nawabshah", province: "Sindh", country: "Pakistan", isVirtual: false },
  { slug: "mirpur-khas", name: "Mirpur Khas", province: "Sindh", country: "Pakistan", isVirtual: false },

  // Punjab
  { slug: "lahore", name: "Lahore", province: "Punjab", country: "Pakistan", isVirtual: false },
  { slug: "rawalpindi", name: "Rawalpindi", province: "Punjab", country: "Pakistan", isVirtual: false },
  { slug: "faisalabad", name: "Faisalabad", province: "Punjab", country: "Pakistan", isVirtual: false },
  { slug: "multan", name: "Multan", province: "Punjab", country: "Pakistan", isVirtual: false },
  { slug: "gujranwala", name: "Gujranwala", province: "Punjab", country: "Pakistan", isVirtual: false },
  { slug: "sialkot", name: "Sialkot", province: "Punjab", country: "Pakistan", isVirtual: false },
  { slug: "bahawalpur", name: "Bahawalpur", province: "Punjab", country: "Pakistan", isVirtual: false },
  { slug: "sargodha", name: "Sargodha", province: "Punjab", country: "Pakistan", isVirtual: false },
  { slug: "gujrat", name: "Gujrat", province: "Punjab", country: "Pakistan", isVirtual: false },
  { slug: "sheikhupura", name: "Sheikhupura", province: "Punjab", country: "Pakistan", isVirtual: false },
  { slug: "jhelum", name: "Jhelum", province: "Punjab", country: "Pakistan", isVirtual: false },
  { slug: "sahiwal", name: "Sahiwal", province: "Punjab", country: "Pakistan", isVirtual: false },
  { slug: "okara", name: "Okara", province: "Punjab", country: "Pakistan", isVirtual: false },
  { slug: "wah-cantt", name: "Wah Cantt", province: "Punjab", country: "Pakistan", isVirtual: false },
  { slug: "taxila", name: "Taxila", province: "Punjab", country: "Pakistan", isVirtual: false },

  // Khyber Pakhtunkhwa (KPK)
  { slug: "peshawar", name: "Peshawar", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "abbottabad", name: "Abbottabad", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "mardan", name: "Mardan", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "swat", name: "Swat", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "topi", name: "Topi (GIKI)", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "kohat", name: "Kohat", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "dera-ismail-khan", name: "Dera Ismail Khan", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "haripur", name: "Haripur", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },

  // Balochistan
  { slug: "quetta", name: "Quetta", province: "Balochistan", country: "Pakistan", isVirtual: false },
  { slug: "gwadar", name: "Gwadar", province: "Balochistan", country: "Pakistan", isVirtual: false },
  { slug: "turbat", name: "Turbat", province: "Balochistan", country: "Pakistan", isVirtual: false },
  { slug: "khuzdar", name: "Khuzdar", province: "Balochistan", country: "Pakistan", isVirtual: false },

  // Azad Jammu & Kashmir (AJK)
  { slug: "muzaffarabad", name: "Muzaffarabad", province: "Azad Kashmir", country: "Pakistan", isVirtual: false },
  { slug: "mirpur-ajk", name: "Mirpur", province: "Azad Kashmir", country: "Pakistan", isVirtual: false },
  { slug: "rawalakot", name: "Rawalakot", province: "Azad Kashmir", country: "Pakistan", isVirtual: false },

  // Gilgit-Baltistan (GB)
  { slug: "gilgit", name: "Gilgit", province: "Gilgit-Baltistan", country: "Pakistan", isVirtual: false },
  { slug: "skardu", name: "Skardu", province: "Gilgit-Baltistan", country: "Pakistan", isVirtual: false },
  { slug: "hunza", name: "Hunza", province: "Gilgit-Baltistan", country: "Pakistan", isVirtual: false },
];

/**
 * Mapping of abbreviations and alternative strings to canonical city slugs.
 */
const CITY_ALIASES: Record<string, string> = {
  khi: "karachi",
  "karachi, sindh": "karachi",
  "karachi pakistan": "karachi",
  lhe: "lahore",
  "lahore, punjab": "lahore",
  "lahore pakistan": "lahore",
  isb: "islamabad",
  "islamabad federal": "islamabad",
  "islamabad pakistan": "islamabad",
  "islamabad, pakistan": "islamabad",
  rwp: "rawalpindi",
  pindi: "rawalpindi",
  "rawalpindi pakistan": "rawalpindi",
  pesh: "peshawar",
  "peshawar kpk": "peshawar",
  "peshawar pakistan": "peshawar",
  qta: "quetta",
  "quetta balochistan": "quetta",
  hyd: "hyderabad",
  "hyderabad sindh": "hyderabad",
  fsd: "faisalabad",
  "faisalabad punjab": "faisalabad",
  mul: "multan",
  giki: "topi",
  topi: "topi",
  "giki topi": "topi",
  nust: "islamabad",
  "nust islamabad": "islamabad",
  seecs: "islamabad",
  lums: "lahore",
  "lums lahore": "lahore",
  comsats: "islamabad",
  cui: "islamabad",
  "comsats islamabad": "islamabad",
  "comsats lahore": "lahore",
  "comsats wah": "wah-cantt",
  "fast islamabad": "islamabad",
  "fast lahore": "lahore",
  "fast karachi": "karachi",
  "fast peshawar": "peshawar",
  online: "online",
  virtual: "online",
  remote: "online",
  webinar: "online",
  zoom: "online",
};

/**
 * Normalize raw location/city strings into a matching CitySeed or slug.
 */
export function normalizeCity(rawLocation: string): { slug: string; matched: boolean } {
  if (!rawLocation) return { slug: "online", matched: false };
  const clean = rawLocation.trim().toLowerCase();

  if (CITY_ALIASES[clean]) {
    return { slug: CITY_ALIASES[clean], matched: true };
  }

  // Check direct slug or name match
  for (const city of PAKISTAN_CITIES) {
    if (
      clean === city.slug ||
      clean === city.name.toLowerCase() ||
      clean.includes(city.name.toLowerCase()) ||
      clean.includes(city.slug)
    ) {
      return { slug: city.slug, matched: true };
    }
  }

  // Check if it denotes remote / online
  if (
    clean.includes("online") ||
    clean.includes("virtual") ||
    clean.includes("remote") ||
    clean.includes("zoom") ||
    clean.includes("meet")
  ) {
    return { slug: "online", matched: true };
  }

  return { slug: "karachi", matched: false };
}
