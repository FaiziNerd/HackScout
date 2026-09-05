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
  { slug: "online", name: "Online / Virtual", province: null, country: "Pakistan", isVirtual: true, lat: null, lng: null },
  { slug: "islamabad", name: "Islamabad", province: "Federal Capital", country: "Pakistan", isVirtual: false, lat: 33.6844, lng: 73.0479 },
  { slug: "karachi", name: "Karachi", province: "Sindh", country: "Pakistan", isVirtual: false, lat: 24.8607, lng: 67.0011 },
  { slug: "hyderabad", name: "Hyderabad", province: "Sindh", country: "Pakistan", isVirtual: false, lat: 25.396, lng: 68.3578 },
  { slug: "sukkur", name: "Sukkur", province: "Sindh", country: "Pakistan", isVirtual: false, lat: 27.7052, lng: 68.8574 },
  { slug: "larkana", name: "Larkana", province: "Sindh", country: "Pakistan", isVirtual: false, lat: 27.559, lng: 68.212 },
  { slug: "nawabshah", name: "Nawabshah", province: "Sindh", country: "Pakistan", isVirtual: false, lat: 26.2442, lng: 68.41 },
  { slug: "mirpur-khas", name: "Mirpur Khas", province: "Sindh", country: "Pakistan", isVirtual: false, lat: 25.5276, lng: 69.015 },
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
  { slug: "peshawar", name: "Peshawar", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 34.0151, lng: 71.5249 },
  { slug: "abbottabad", name: "Abbottabad", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 34.1463, lng: 73.2117 },
  { slug: "mardan", name: "Mardan", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 34.198, lng: 72.04 },
  { slug: "swat", name: "Swat", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 34.775, lng: 72.36 },
  { slug: "topi", name: "Topi (GIKI)", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 34.1494, lng: 72.624 },
  { slug: "kohat", name: "Kohat", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 33.5889, lng: 71.4425 },
  { slug: "dera-ismail-khan", name: "Dera Ismail Khan", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 31.8315, lng: 70.901 },
  { slug: "haripur", name: "Haripur", province: "Khyber Pakhtunkhwa", country: "Pakistan", isVirtual: false, lat: 33.9946, lng: 72.934 },
  { slug: "quetta", name: "Quetta", province: "Balochistan", country: "Pakistan", isVirtual: false, lat: 30.1798, lng: 66.975 },
  { slug: "gwadar", name: "Gwadar", province: "Balochistan", country: "Pakistan", isVirtual: false, lat: 25.1264, lng: 62.3225 },
  { slug: "turbat", name: "Turbat", province: "Balochistan", country: "Pakistan", isVirtual: false, lat: 26.0023, lng: 63.05 },
  { slug: "khuzdar", name: "Khuzdar", province: "Balochistan", country: "Pakistan", isVirtual: false, lat: 27.8, lng: 66.61 },
  { slug: "muzaffarabad", name: "Muzaffarabad", province: "Azad Kashmir", country: "Pakistan", isVirtual: false, lat: 34.37, lng: 73.471 },
  { slug: "mirpur-ajk", name: "Mirpur", province: "Azad Kashmir", country: "Pakistan", isVirtual: false, lat: 33.147, lng: 73.752 },
  { slug: "rawalakot", name: "Rawalakot", province: "Azad Kashmir", country: "Pakistan", isVirtual: false, lat: 33.858, lng: 73.76 },
  { slug: "gilgit", name: "Gilgit", province: "Gilgit-Baltistan", country: "Pakistan", isVirtual: false, lat: 35.9208, lng: 74.3144 },
  { slug: "skardu", name: "Skardu", province: "Gilgit-Baltistan", country: "Pakistan", isVirtual: false, lat: 35.2971, lng: 75.6335 },
  { slug: "hunza", name: "Hunza", province: "Gilgit-Baltistan", country: "Pakistan", isVirtual: false, lat: 36.3167, lng: 74.65 },
];

function generateCuid() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}

function daysFromNow(days: number, hour = 9, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

async function main() {
  console.log(`Seeding ${PAKISTAN_CITIES.length} Pakistan cities + Online...`);

  for (const city of PAKISTAN_CITIES) {
    const id = generateCuid();
    await pool.query(
      `
      INSERT INTO "City" ("id", "slug", "name", "province", "country", "eventCount", "isVirtual", "lat", "lng")
      VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8)
      ON CONFLICT ("slug") DO UPDATE SET
        "name" = EXCLUDED."name",
        "province" = EXCLUDED."province",
        "country" = EXCLUDED."country",
        "isVirtual" = EXCLUDED."isVirtual",
        "lat" = EXCLUDED."lat",
        "lng" = EXCLUDED."lng";
      `,
      [id, city.slug, city.name, city.province, city.country, city.isVirtual, city.lat, city.lng]
    );
  }

  const LAUNCH_EVENTS = [
    {
      slug: "fast-national-hackathon-2026",
      title: "FAST National Hackathon 2026",
      description:
        "ACM FAST-NUCES Lahore's flagship 36-hour build. Student and early-career teams ship a working prototype, demo to industry mentors, and compete for a national prize pool before the registration cutoff.",
      category: "hackathon",
      source: "university",
      sourceUrl: "https://lhr.nu.edu.pk",
      registrationUrl: "https://lhr.nu.edu.pk",
      startDate: daysFromNow(10, 9),
      endDate: daysFromNow(11, 18),
      registrationDeadline: daysFromNow(3, 23, 59),
      citySlug: "lahore",
      venue: "FAST-NUCES Lahore",
      isOnline: false,
      tags: ["hackathon", "students", "national"],
      prizePool: "PKR 500,000",
      organizerName: "ACM FAST-NUCES",
    },
    {
      slug: "pycon-pakistan-2026",
      title: "PyCon Pakistan Annual Summit",
      description:
        "Pakistan's yearly Python conference: keynotes, sprints, and hallway track. Registration covers talks, contributor sprints, and a city meetup the night before.",
      category: "conference",
      source: "community",
      sourceUrl: "https://pk.pycon.org",
      registrationUrl: "https://pk.pycon.org",
      startDate: daysFromNow(18, 9),
      endDate: daysFromNow(19, 18),
      registrationDeadline: daysFromNow(6, 23, 59),
      citySlug: "karachi",
      venue: "IBA City Campus",
      isOnline: false,
      tags: ["python", "conference", "sprints"],
      prizePool: null,
      organizerName: "Python PK",
    },
    {
      slug: "nust-ai-summit-2026",
      title: "NUST Robotics & AI Challenge",
      description:
        "A robotics and applied-AI competition hosted at NUST SEECS. Teams bring a working demo, not a slide deck, and face a live hardware plus software round.",
      category: "competition",
      source: "university",
      sourceUrl: "https://nust.edu.pk",
      registrationUrl: "https://seecs.nust.edu.pk",
      startDate: daysFromNow(16, 9),
      endDate: daysFromNow(17, 17),
      registrationDeadline: daysFromNow(9, 23, 59),
      citySlug: "islamabad",
      venue: "NUST SEECS",
      isOnline: false,
      tags: ["ai", "robotics", "nust"],
      prizePool: "PKR 350,000",
      organizerName: "NUST SEECS",
    },
    {
      slug: "giki-software-olympiad-2026",
      title: "GIKI Software Olympiad",
      description:
        "ACM GIKI's all-Pakistan software olympiad: algorithmic rounds, a product track, and on-campus finals in Topi. Travel stipends for shortlisted teams.",
      category: "hackathon",
      source: "university",
      sourceUrl: "https://giki.edu.pk",
      registrationUrl: "https://giki.edu.pk",
      startDate: daysFromNow(22, 9),
      endDate: daysFromNow(23, 18),
      registrationDeadline: daysFromNow(15, 23, 59),
      citySlug: "topi",
      venue: "Ghulam Ishaq Khan Institute",
      isOnline: false,
      tags: ["olympiad", "algorithms", "giki"],
      prizePool: "PKR 400,000",
      organizerName: "ACM GIKI",
    },
    {
      slug: "karachi-ai-hackathon-2026",
      title: "Karachi AI Hackathon 2026",
      description:
        "A 36-hour build sprint for students and early-career engineers in Karachi. Form a team, ship a working prototype, and demo it to local mentors before registration closes.",
      category: "hackathon",
      source: "admin",
      sourceUrl: "https://gdg.community.dev",
      registrationUrl: "https://gdg.community.dev",
      startDate: daysFromNow(20, 9),
      endDate: daysFromNow(21, 18),
      registrationDeadline: daysFromNow(12, 23, 59),
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
      startDate: daysFromNow(8, 18, 30),
      endDate: daysFromNow(8, 21),
      registrationDeadline: daysFromNow(7, 18),
      citySlug: "lahore",
      venue: "Plan9, Arfa Tower",
      isOnline: false,
      tags: ["community", "networking"],
      prizePool: null,
      organizerName: "Lahore.dev",
    },
    {
      slug: "lums-startup-weekend-2026",
      title: "LUMS Startup Weekend",
      description:
        "A 54-hour founder sprint at LUMS: pitch on Friday, build through the weekend, demo on Sunday. Mentors from Lahore's startup circuit sit on the final jury.",
      category: "festival",
      source: "university",
      sourceUrl: "https://lums.edu.pk",
      registrationUrl: "https://lums.edu.pk",
      startDate: daysFromNow(28, 17),
      endDate: daysFromNow(30, 18),
      registrationDeadline: daysFromNow(21, 23, 59),
      citySlug: "lahore",
      venue: "LUMS SDSB",
      isOnline: false,
      tags: ["startups", "lums", "founders"],
      prizePool: "PKR 150,000",
      organizerName: "LUMS Entrepreneurial Society",
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
      startDate: daysFromNow(14, 10),
      endDate: daysFromNow(14, 14),
      registrationDeadline: daysFromNow(11, 12),
      citySlug: "islamabad",
      venue: "NUST SEECS",
      isOnline: false,
      tags: ["product", "workshop"],
      prizePool: null,
      organizerName: "NUST ACM",
    },
    {
      slug: "comsats-career-fair-2026",
      title: "COMSATS Islamabad Career Fair",
      description:
        "Internship and graduate hiring day at COMSATS. Bring a resume, a GitHub, and a two-minute pitch. Open to students from the twin cities.",
      category: "career_fair",
      source: "university",
      sourceUrl: "https://islamabad.comsats.edu.pk",
      registrationUrl: "https://islamabad.comsats.edu.pk",
      startDate: daysFromNow(25, 10),
      endDate: daysFromNow(25, 16),
      registrationDeadline: daysFromNow(18, 23, 59),
      citySlug: "islamabad",
      venue: "COMSATS Islamabad",
      isOnline: false,
      tags: ["careers", "internships"],
      prizePool: null,
      organizerName: "COMSATS Career Services",
    },
    {
      slug: "rawalpindi-cyber-meetup-2026",
      title: "Rawalpindi Cybersecurity Circle",
      description:
        "A twin-cities meetup on defensive security, CTF writeups, and first jobs in SOC roles. Lightning talks plus an open clinic for student questions.",
      category: "meetup",
      source: "linkedin",
      sourceUrl: "https://www.linkedin.com",
      registrationUrl: "https://www.linkedin.com",
      startDate: daysFromNow(9, 18),
      endDate: daysFromNow(9, 21),
      registrationDeadline: daysFromNow(8, 12),
      citySlug: "rawalpindi",
      venue: "Arid Agriculture University",
      isOnline: false,
      tags: ["security", "ctf", "community"],
      prizePool: null,
      organizerName: "Pindi.dev",
    },
    {
      slug: "faisalabad-agritech-meetup-2026",
      title: "Faisalabad AgriTech Meetup",
      description:
        "Builders, agronomists, and campus clubs looking at sensors, marketplaces, and textile-adjacent software. Short talks and a demo table.",
      category: "meetup",
      source: "community",
      sourceUrl: "https://lu.ma",
      registrationUrl: "https://lu.ma",
      startDate: daysFromNow(13, 17),
      endDate: daysFromNow(13, 20),
      registrationDeadline: daysFromNow(12, 12),
      citySlug: "faisalabad",
      venue: "NFC Institute of Engineering",
      isOnline: false,
      tags: ["agritech", "meetup"],
      prizePool: null,
      organizerName: "Faisalabad Builders",
    },
    {
      slug: "multan-cloud-workshop-2026",
      title: "Multan Cloud & Backend Workshop",
      description:
        "A hands-on afternoon on shipping a small API to the cloud. Aimed at BZU and NFC students who have never deployed beyond localhost.",
      category: "workshop",
      source: "community",
      sourceUrl: "https://www.eventbrite.com",
      registrationUrl: "https://www.eventbrite.com",
      startDate: daysFromNow(17, 11),
      endDate: daysFromNow(17, 16),
      registrationDeadline: daysFromNow(15, 18),
      citySlug: "multan",
      venue: "Bahauddin Zakariya University",
      isOnline: false,
      tags: ["cloud", "backend", "workshop"],
      prizePool: null,
      organizerName: "Multan.dev",
    },
    {
      slug: "peshawar-app-innovation-2026",
      title: "Peshawar App Innovation Sprint",
      description:
        "UET Peshawar and IMSciences students ship a mobile or web prototype in one weekend. Mentors from local product teams review Sunday demos.",
      category: "hackathon",
      source: "university",
      sourceUrl: "https://www.uetpeshawar.edu.pk",
      registrationUrl: "https://www.uetpeshawar.edu.pk",
      startDate: daysFromNow(24, 9),
      endDate: daysFromNow(25, 17),
      registrationDeadline: daysFromNow(19, 23, 59),
      citySlug: "peshawar",
      venue: "UET Peshawar",
      isOnline: false,
      tags: ["hackathon", "mobile", "peshawar"],
      prizePool: "PKR 120,000",
      organizerName: "UET Peshawar ACM",
    },
    {
      slug: "quetta-student-hack-2026",
      title: "Quetta Student Hack",
      description:
        "BUITEMS-hosted student hackathon for Balochistan campuses. Beginner-friendly tracks in web, data, and civic tech, with a public demo hour.",
      category: "hackathon",
      source: "university",
      sourceUrl: "https://www.buitms.edu.pk",
      registrationUrl: "https://www.buitms.edu.pk",
      startDate: daysFromNow(27, 9),
      endDate: daysFromNow(27, 20),
      registrationDeadline: daysFromNow(20, 23, 59),
      citySlug: "quetta",
      venue: "BUITEMS",
      isOnline: false,
      tags: ["students", "hackathon", "balochistan"],
      prizePool: "PKR 80,000",
      organizerName: "BUITEMS Computing Society",
    },
    {
      slug: "hyderabad-code-cup-2026",
      title: "Hyderabad Code Cup",
      description:
        "Mehran UET's programming contest plus a short product challenge. Open to Sindh university teams; on-site finals in Hyderabad.",
      category: "competition",
      source: "university",
      sourceUrl: "https://www.muet.edu.pk",
      registrationUrl: "https://www.muet.edu.pk",
      startDate: daysFromNow(21, 10),
      endDate: daysFromNow(21, 18),
      registrationDeadline: daysFromNow(16, 23, 59),
      citySlug: "hyderabad",
      venue: "Mehran University of Engineering & Technology",
      isOnline: false,
      tags: ["competitive-programming", "sindh"],
      prizePool: "PKR 90,000",
      organizerName: "Mehran UET ACM",
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
      startDate: daysFromNow(26, 10),
      endDate: daysFromNow(27, 20),
      registrationDeadline: daysFromNow(24, 23, 59),
      citySlug: "online",
      venue: null,
      isOnline: true,
      tags: ["opensource", "remote"],
      prizePool: "$1,000",
      organizerName: "HackScout",
    },
    {
      slug: "gdg-islamabad-devfest-workshop-2026",
      title: "GDG Islamabad DevFest Workshop",
      description:
        "A one-day Android and Firebase workshop ahead of DevFest. Bring a laptop; beginner and intermediate tracks run in parallel.",
      category: "workshop",
      source: "community",
      sourceUrl: "https://gdg.community.dev",
      registrationUrl: "https://gdg.community.dev",
      startDate: daysFromNow(19, 10),
      endDate: daysFromNow(19, 17),
      registrationDeadline: daysFromNow(14, 23, 59),
      citySlug: "islamabad",
      venue: "NUST Incubation Center",
      isOnline: false,
      tags: ["android", "firebase", "gdg"],
      prizePool: null,
      organizerName: "GDG Islamabad",
    },
  ];

  console.log(`Seeding ${LAUNCH_EVENTS.length} launch events...`);

  for (const event of LAUNCH_EVENTS) {
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
        "category" = EXCLUDED."category",
        "source" = EXCLUDED."source",
        "sources" = EXCLUDED."sources",
        "sourceUrl" = EXCLUDED."sourceUrl",
        "startDate" = EXCLUDED."startDate",
        "endDate" = EXCLUDED."endDate",
        "registrationDeadline" = EXCLUDED."registrationDeadline",
        "cityId" = EXCLUDED."cityId",
        "venue" = EXCLUDED."venue",
        "isOnline" = EXCLUDED."isOnline",
        "tags" = EXCLUDED."tags",
        "prizePool" = EXCLUDED."prizePool",
        "organizerName" = EXCLUDED."organizerName",
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
