-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DiscoveryPrefs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portals" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "titleFilter" TEXT,
    "minScore" TEXT,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_DiscoveryPrefs" ("id", "keywords", "minScore", "portals", "updatedAt") SELECT "id", "keywords", "minScore", "portals", "updatedAt" FROM "DiscoveryPrefs";
DROP TABLE "DiscoveryPrefs";
ALTER TABLE "new_DiscoveryPrefs" RENAME TO "DiscoveryPrefs";
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cv" TEXT NOT NULL,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "location" TEXT,
    "workType" TEXT,
    "scoringWeights" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "linkedin" TEXT,
    "portfolioUrl" TEXT,
    "github" TEXT,
    "twitter" TEXT,
    "headline" TEXT,
    "exitStory" TEXT,
    "superpowers" TEXT,
    "currency" TEXT,
    "salaryFloor" INTEGER,
    "locationFlexibility" TEXT,
    "timezone" TEXT,
    "visaStatus" TEXT,
    "onsiteAvailability" TEXT,
    "proofPoints" TEXT,
    "roleTargets" TEXT,
    "cvFormat" TEXT,
    "canvaDesignId" TEXT,
    "autoPdfThreshold" REAL
);
INSERT INTO "new_Profile" ("autoPdfThreshold", "canvaDesignId", "createdAt", "currency", "cv", "cvFormat", "email", "exitStory", "fullName", "github", "headline", "id", "linkedin", "location", "locationFlexibility", "onsiteAvailability", "phone", "portfolioUrl", "proofPoints", "salaryFloor", "salaryMax", "salaryMin", "scoringWeights", "superpowers", "timezone", "twitter", "updatedAt", "visaStatus", "workType") SELECT "autoPdfThreshold", "canvaDesignId", "createdAt", "currency", "cv", "cvFormat", "email", "exitStory", "fullName", "github", "headline", "id", "linkedin", "location", "locationFlexibility", "onsiteAvailability", "phone", "portfolioUrl", "proofPoints", "salaryFloor", "salaryMax", "salaryMin", "scoringWeights", "superpowers", "timezone", "twitter", "updatedAt", "visaStatus", "workType" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
