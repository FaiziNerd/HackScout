-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('pending', 'sent');

-- CreateTable
CREATE TABLE "DeadlineReminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "daysBefore" INTEGER NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'pending',
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "DeadlineReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeadlineReminder_userId_eventId_daysBefore_key"
ON "DeadlineReminder"("userId", "eventId", "daysBefore");

-- CreateIndex
CREATE INDEX "DeadlineReminder_eventId_idx" ON "DeadlineReminder"("eventId");

-- CreateIndex
CREATE INDEX "DeadlineReminder_status_createdAt_idx"
ON "DeadlineReminder"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "DeadlineReminder"
ADD CONSTRAINT "DeadlineReminder_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeadlineReminder"
ADD CONSTRAINT "DeadlineReminder_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
