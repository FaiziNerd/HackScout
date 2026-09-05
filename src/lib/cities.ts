export type CitySeed = {
  slug: string;
  name: string;
  province?: string;
  country?: string;
  isVirtual: boolean;
  lat?: number;
  lng?: number;
};

export const PAKISTAN_CITIES: CitySeed[] = [
  // Online / Virtual first-class pseudo-city
  { slug: "online", name: "Online / Virtual", province: undefined, country: "Pakistan", isVirtual: true },

  // Federal Capital
  { slug: "islamabad", name: "Islamabad", province: "Federal Capital", country: "Pakistan", isVirtual: false, lat: 33.6844, lng: 73.0479 },

  // Sindh
  { slug: "karachi", name: "Karachi", province: "Sindh", country: "Pakistan", isVirtual: false, lat: 24.8607, lng: 67.0011 },
  { slug: "hyderabad", name: "Hyderabad", province: "Sindh", country: "Pakistan", isVirtual: false, lat: 25.396, lng: 68.3578 },
  { slug: "sukkur", name: "Sukkur", province: "Sindh", country: "Pakistan", isVirtual: false, lat: 27.7052, lng: 68.8574 },
  { slug: "larkana", name: "Larkana", province: "Sindh", country: "Pakistan", isVirtual: false, lat: 27.559, lng: 68.212 },
  { slug: "nawabshah", name: "Nawabshah", province: "Sindh", country: "Pakistan", isVirtual: false, lat: 26.2442, lng: 68.41 },
  { slug: "mirpur-khas", name: "Mirpur Khas", province: "Sindh", country: "Pakistan", isVirtual: false, lat: 25.5276, lng: 69.015 },

  // Punjab
  { slug: "lahore", name: "Lahore", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 31.5204, lng: 74.3587 },
  { slug: "rawalpindi", name: "Rawalpindi", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 33.5651, lng: 73.0169 },
  { slug: "faisalabad", name: "Faisalabad", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 31.4504, lng: 73.135 },
  { slug: "multan", name: "Multan", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 30.1575, lng: 71.5249 },
  { slug: "gujranwala", name: "Gujranwala", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 32.1877, lng: 74.1945 },
  { slug: "sialkot", name: "Sialkot", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 32.4945, lng: 74.5229 },
  { slug: "bahawalpur", name: "Bahawalpur", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 29.3956, lng: 71.6836 },
  { slug: "sargodha", name: "Sargodha", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 32.0836, lng: 72.6711 },
  { slug: "gujrat", name: "Gujrat", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 32.574, lng: 74.078 },
  { slug: "sheikhupura", name: "Sheikhupura", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 31.7167, lng: 73.985 },
  { slug: "jhelum", name: "Jhelum", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 32.9425, lng: 73.7257 },
  { slug: "sahiwal", name: "Sahiwal", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 30.671, lng: 73.106 },
  { slug: "okara", name: "Okara", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 30.8081, lng: 73.4458 },
  { slug: "wah-cantt", name: "Wah Cantt", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 33.7715, lng: 72.7511 },
  { slug: "taxila", name: "Taxila", province: "Punjab", country: "Pakistan", isVirtual: false, lat: 33.7463, lng: 72.8397 },

  // Khyber Pakhtunkhwa (KPK)
  { slug: "peshawar", name: "Peshawar", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 34.0151, lng: 71.5249 },
  { slug: "abbottabad", name: "Abbottabad", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 34.1463, lng: 73.2117 },
  { slug: "mardan", name: "Mardan", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 34.198, lng: 72.04 },
  { slug: "swat", name: "Swat", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 34.775, lng: 72.36 },
  { slug: "topi", name: "Topi (GIKI)", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 34.1494, lng: 72.624 },
  { slug: "kohat", name: "Kohat", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 33.5889, lng: 71.4425 },
  { slug: "dera-ismail-khan", name: "Dera Ismail Khan", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 31.8315, lng: 70.901 },
  { slug: "haripur", name: "Haripur", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 33.9946, lng: 72.934 },

  // Balochistan
  { slug: "quetta", name: "Quetta", province: "Balochistan", country: "Pakistan", isVirtual: false, lat: 30.1798, lng: 66.975 },
  { slug: "gwadar", name: "Gwadar", province: "Balochistan", country: "Pakistan", isVirtual: false, lat: 25.1264, lng: 62.3225 },
  { slug: "turbat", name: "Turbat", province: "Balochistan", country: "Pakistan", isVirtual: false, lat: 26.0023, lng: 63.05 },
  { slug: "khuzdar", name: "Khuzdar", province: "Balochistan", country: "Pakistan", isVirtual: false, lat: 27.8, lng: 66.61 },

  // Azad Jammu & Kashmir (AJK)
  { slug: "muzaffarabad", name: "Muzaffarabad", province: "Azad Kashmir", country: "Pakistan", isVirtual: false, lat: 34.37, lng: 73.471 },
  { slug: "mirpur-ajk", name: "Mirpur", province: "Azad Kashmir", country: "Pakistan", isVirtual: false, lat: 33.147, lng: 73.752 },
  { slug: "rawalakot", name: "Rawalakot", province: "Azad Kashmir", country: "Pakistan", isVirtual: false, lat: 33.858, lng: 73.76 },

  // Gilgit-Baltistan (GB)
  { slug: "gilgit", name: "Gilgit", province: "Gilgit-Baltistan", country: "Pakistan", isVirtual: false, lat: 35.9208, lng: 74.3144 },
  { slug: "skardu", name: "Skardu", province: "Gilgit-Baltistan", country: "Pakistan", isVirtual: false, lat: 35.2971, lng: 75.6335 },
  { slug: "hunza", name: "Hunza", province: "Gilgit-Baltistan", country: "Pakistan", isVirtual: false, lat: 36.3167, lng: 74.65 },
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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

/** Nearest non-virtual city with coordinates to a lat/lng pair. */
export function findNearestCitySlug(lat: number, lng: number): string | null {
  let best: { slug: string; distance: number } | null = null;

  for (const city of PAKISTAN_CITIES) {
    if (city.isVirtual || city.lat == null || city.lng == null) continue;
    const distance = haversineKm(lat, lng, city.lat, city.lng);
    if (!best || distance < best.distance) {
      best = { slug: city.slug, distance };
    }
  }

  return best?.slug ?? null;
}
