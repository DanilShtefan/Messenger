-- CreateEnum
CREATE TYPE "friend_status" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterTable
ALTER TABLE "friends" ADD COLUMN     "status" "friend_status" NOT NULL DEFAULT 'PENDING';
