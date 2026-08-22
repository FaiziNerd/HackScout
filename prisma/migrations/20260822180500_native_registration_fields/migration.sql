-- AlterTable
ALTER TABLE "Event" ADD COLUMN "formFields" JSONB;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN "email" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Registration_eventId_email_key" ON "Registration"("eventId", "email");
