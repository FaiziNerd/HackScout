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

  const res = await pool.query(`SELECT count(*) FROM "City";`);
  console.log(`Seeding complete. Total cities in database: ${res.rows[0].count}`);
}

main()
  .catch((e) => {
    console.error("Error while seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
