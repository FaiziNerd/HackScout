CREATE TABLE "WeeklyDigest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'pending',
    "eventCount" INTEGER NOT NULL,
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "WeeklyDigest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeeklyDigest_userId_weekOf_key"
ON "WeeklyDigest"("userId", "weekOf");

CREATE INDEX "WeeklyDigest_status_createdAt_idx"
ON "WeeklyDigest"("status", "createdAt");

ALTER TABLE "WeeklyDigest"
ADD CONSTRAINT "WeeklyDigest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
