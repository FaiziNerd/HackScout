-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'approved';
