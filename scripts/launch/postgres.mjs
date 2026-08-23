import { Client } from "pg";

function normalizeConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    if (!url.protocol.startsWith("postgres")) {
      return connectionString;
    }

    // Prisma accepts sslaccept=accept_invalid_certs, but node-postgres does not.
    // Keep SSL enabled through the Client option below and avoid pg parsing conflicts.
    url.searchParams.delete("sslmode");
    url.searchParams.delete("sslaccept");
    return url.toString();
  } catch {
    return connectionString;
  }
}

export function createPostgresClient(connectionString) {
  return new Client({
    connectionString: normalizeConnectionString(connectionString),
    ssl: { rejectUnauthorized: false },
  });
}
