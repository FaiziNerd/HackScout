CREATE TABLE "MissingEventReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "citySlug" TEXT,
    "cityName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "description" TEXT,
    "pagePath" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissingEventReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MissingEventReport_status_createdAt_idx"
ON "MissingEventReport"("status", "createdAt");
