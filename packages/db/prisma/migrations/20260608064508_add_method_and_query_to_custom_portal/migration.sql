-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomPortal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "provider" TEXT,
    "api" TEXT,
    "method" TEXT NOT NULL DEFAULT 'auto',
    "query" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_CustomPortal" ("api", "createdAt", "enabled", "id", "name", "notes", "provider", "url") SELECT "api", "createdAt", "enabled", "id", "name", "notes", "provider", "url" FROM "CustomPortal";
DROP TABLE "CustomPortal";
ALTER TABLE "new_CustomPortal" RENAME TO "CustomPortal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
