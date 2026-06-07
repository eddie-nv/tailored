-- AlterTable
ALTER TABLE "CustomPortal" ADD COLUMN "api" TEXT;
ALTER TABLE "CustomPortal" ADD COLUMN "notes" TEXT;
ALTER TABLE "CustomPortal" ADD COLUMN "provider" TEXT;

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
