-- AlterTable
ALTER TABLE "Event" ADD COLUMN "submittedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Event_submittedByUserId_idx" ON "Event"("submittedByUserId");
