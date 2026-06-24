-- AlterTable
ALTER TABLE "messages" ADD COLUMN "reactions" JSONB DEFAULT '{}',
ADD COLUMN "forwarded_from" JSONB;
