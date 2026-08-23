import "dotenv/config";
import { pathToFileURL } from "node:url";

import { closeScraperQueue, enqueueRunAllScrapers } from "@/lib/scraper-queue";

async function main() {
  const result = await enqueueRunAllScrapers("cli");
  console.log(`Enqueued run-all job ${result.jobId ?? "(id pending)"}. Keep npm run worker running.`);
}

const isDirectRun =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => closeScraperQueue());
}
