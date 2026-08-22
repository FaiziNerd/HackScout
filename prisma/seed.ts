import "dotenv/config";
import pg from "pg";

const rawConnectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!rawConnectionString) {
  throw new Error("Neither DIRECT_URL nor DATABASE_URL is set");
}

const parsedUrl = new URL(rawConnectionString);

const pool = new pg.Pool({
  user: decodeURIComponent(parsedUrl.username),
  password: decodeURIComponent(parsedUrl.password),
  host: parsedUrl.hostname,
  port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 5432,
  database: parsedUrl.pathname.replace(/^\//, "") || "postgres",
  ssl: { rejectUnauthorized: false },
});

const PAKISTAN_CITIES = [
  { slug: "online", name: "Online / Virtual", province: null, country: "Pakistan", isVirtual: true },
  { slug: "islamabad", name: "Islamabad", province: "Federal Capital", country: "Pakistan", isVirtual: false },
  { slug: "karachi", name: "Karachi", province: "Sindh", country: "Pakistan", isVirtual: false },
  { slug: "hyderabad", name: "Hyderabad", province: "Sindh", country: "Pakistan", isVirtual: false },
  { slug: "sukkur", name: "Sukkur", province: "Sindh", country: "Pakistan", isVirtual: false },
  { slug: "larkana", name: "Larkana", province: "Sindh", country: "Pakistan", isVirtual: false },
  { slug: "nawabshah", name: "Nawabshah", province: "Sindh", country: "Pakistan", isVirtual: false },
  { slug: "mirpur-khas", name: "Mirpur Khas", province: "Sindh", country: "Pakistan", isVirtual: false },
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
  { slug: "peshawar", name: "Peshawar", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "abbottabad", name: "Abbottabad", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "mardan", name: "Mardan", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "swat", name: "Swat", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "topi", name: "Topi (GIKI)", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "kohat", name: "Kohat", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "dera-ismail-khan", name: "Dera Ismail Khan", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "haripur", name: "Haripur", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false },
  { slug: "quetta", name: "Quetta", province: "Balochistan", country: "Pakistan", isVirtual: false },
  { slug: "gwadar", name: "Gwadar", province: "Balochistan", country: "Pakistan", isVirtual: false },
  { slug: "turbat", name: "Turbat", province: "Balochistan", country: "Pakistan", isVirtual: false },
  { slug: "khuzdar", name: "Khuzdar", province: "Balochistan", country: "Pakistan", isVirtual: false },
  { slug: "muzaffarabad", name: "Muzaffarabad", province: "Azad Kashmir", country: "Pakistan", isVirtual: false },
  { slug: "mirpur-ajk", name: "Mirpur", province: "Azad Kashmir", country: "Pakistan", isVirtual: false },
  { slug: "rawalakot", name: "Rawalakot", province: "Azad Kashmir", country: "Pakistan", isVirtual: false },
  { slug: "gilgit", name: "Gilgit", province: "Gilgit-Baltistan", country: "Pakistan", isVirtual: false },
  { slug: "skardu", name: "Skardu", province: "Gilgit-Baltistan", country: "Pakistan", isVirtual: false },
  { slug: "hunza", name: "Hunza", province: "Gilgit-Baltistan", country: "Pakistan", isVirtual: false },
];

function generateCuid() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}

async function main() {
  console.log(`Seeding ${PAKISTAN_CITIES.length} Pakistan cities + Online...`);

  for (const city of PAKISTAN_CITIES) {
    const id = generateCuid();
    await pool.query(
      `
      INSERT INTO "City" ("id", "slug", "name", "province", "country", "eventCount", "isVirtual")
      VALUES ($1, $2, $3, $4, $5, 0, $6)
      ON CONFLICT ("slug") DO UPDATE SET
        "name" = EXCLUDED."name",
        "province" = EXCLUDED."province",
        "country" = EXCLUDED."country",
        "isVirtual" = EXCLUDED."isVirtual";
      `,
      [id, city.slug, city.name, city.province, city.country, city.isVirtual]
    );
  }

  const SAMPLE_EVENTS = [
    {
      slug: "karachi-ai-hackathon-2026",
      title: "Karachi AI Hackathon 2026",
      description:
        "A 36-hour build sprint for students and early-career engineers in Karachi. Form a team, ship a working prototype, and demo it to local mentors before registration closes.",
      category: "hackathon",
      source: "admin",
      sourceUrl: "https://devfolio.co",
      registrationUrl: "https://devfolio.co",
      startDate: "2026-09-12T09:00:00+05:00",
      endDate: "2026-09-13T18:00:00+05:00",
      registrationDeadline: "2026-09-05T23:59:00+05:00",
      citySlug: "karachi",
      venue: "IBA City Campus",
      isOnline: false,
      tags: ["ai", "students"],
      prizePool: "PKR 250,000",
      organizerName: "GDG Karachi",
    },
    {
      slug: "lahore-builders-meetup-2026",
      title: "Lahore Builders Meetup",
      description:
        "An evening meetup for product, design, and engineering folks in Lahore. Talks on shipping student products, plus open networking after the last session.",
      category: "meetup",
      source: "luma",
      sourceUrl: "https://lu.ma",
      registrationUrl: "https://lu.ma",
      startDate: "2026-09-03T18:30:00+05:00",
      endDate: "2026-09-03T21:00:00+05:00",
      registrationDeadline: "2026-09-02T18:00:00+05:00",
      citySlug: "lahore",
      venue: "Plan9, Arfa Tower",
      isOnline: false,
      tags: ["community", "networking"],
      prizePool: null,
      organizerName: "Lahore.dev",
    },
    {
      slug: "islamabad-product-workshop-2026",
      title: "Islamabad Product Workshop",
      description:
        "A half-day workshop on scoping a hackathon idea, writing a one-pager, and presenting a demo without a slide deck overload.",
      category: "workshop",
      source: "eventbrite",
      sourceUrl: "https://www.eventbrite.com",
      registrationUrl: "https://www.eventbrite.com",
      startDate: "2026-09-20T10:00:00+05:00",
      endDate: "2026-09-20T14:00:00+05:00",
      registrationDeadline: "2026-09-18T12:00:00+05:00",
      citySlug: "islamabad",
      venue: "NUST SEECS",
      isOnline: false,
      tags: ["product", "workshop"],
      prizePool: null,
      organizerName: "NUST ACM",
    },
    {
      slug: "pakistan-open-source-sprint-2026",
      title: "Pakistan Open Source Sprint",
      description:
        "A nationwide online sprint for contributors. Pick an issue, pair with a mentor, and submit a pull request before the weekend cutoff.",
      category: "competition",
      source: "devpost",
      sourceUrl: "https://devpost.com",
      registrationUrl: "https://devpost.com",
      startDate: "2026-09-26T10:00:00+05:00",
      endDate: "2026-09-27T20:00:00+05:00",
      registrationDeadline: "2026-09-24T23:59:00+05:00",
      citySlug: "online",
      venue: null,
      isOnline: true,
      tags: ["opensource", "remote"],
      prizePool: "$1,000",
      organizerName: "HackScout",
    },
  ];

  console.log(`Seeding ${SAMPLE_EVENTS.length} sample events...`);

  for (const event of SAMPLE_EVENTS) {
    const city = await pool.query(`SELECT id FROM "City" WHERE slug = $1 LIMIT 1`, [event.citySlug]);
    const cityId = city.rows[0]?.id;
    if (!cityId) {
      throw new Error(`Missing city for sample event: ${event.citySlug}`);
    }

    await pool.query(
      `
      INSERT INTO "Event" (
        "id", "slug", "title", "description", "category", "country", "source", "sources",
        "sourceUrl", "startDate", "endDate", "registrationDeadline", "cityId", "venue",
        "isOnline", "tags", "prizePool", "organizerName", "registrationType", "registrationUrl",
        "status", "reviewStatus", "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5::"EventCategory", 'Pakistan', $6::"EventSource", ARRAY[$6]::"EventSource"[],
        $7, $8::timestamptz, $9::timestamptz, $10::timestamptz, $11, $12,
        $13, $14::text[], $15, $16, 'external'::"RegistrationType", $17,
        'upcoming'::"EventStatus", 'approved'::"ReviewStatus", NOW(), NOW()
      )
      ON CONFLICT ("slug") DO UPDATE SET
        "title" = EXCLUDED."title",
        "description" = EXCLUDED."description",
        "registrationDeadline" = EXCLUDED."registrationDeadline",
        "registrationUrl" = EXCLUDED."registrationUrl",
        "status" = 'upcoming'::"EventStatus",
        "reviewStatus" = 'approved'::"ReviewStatus",
        "updatedAt" = NOW();
      `,
      [
        generateCuid(),
        event.slug,
        event.title,
        event.description,
        event.category,
        event.source,
        event.sourceUrl,
        event.startDate,
        event.endDate,
        event.registrationDeadline,
        cityId,
        event.venue,
        event.isOnline,
        event.tags,
        event.prizePool,
        event.organizerName,
        event.registrationUrl,
      ]
    );
  }

  const [cities, events] = await Promise.all([
    pool.query(`SELECT count(*) FROM "City";`),
    pool.query(`SELECT count(*) FROM "Event" WHERE "reviewStatus" = 'approved';`),
  ]);
  console.log(`Seeding complete. Cities: ${cities.rows[0].count}. Approved events: ${events.rows[0].count}.`);
}

main()
  .catch((e) => {
    console.error("Error while seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
