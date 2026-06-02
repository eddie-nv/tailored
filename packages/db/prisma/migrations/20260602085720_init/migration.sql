-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cv" TEXT NOT NULL,
    "targetRoles" TEXT NOT NULL,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "location" TEXT,
    "workType" TEXT,
    "scoringWeights" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DiscoveryPrefs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portals" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "archetypes" TEXT NOT NULL,
    "minScore" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ResumePrefs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "template" TEXT NOT NULL DEFAULT 'default',
    "sectionOrder" TEXT NOT NULL,
    "tone" TEXT,
    "keywords" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "url" TEXT,
    "source" TEXT NOT NULL,
    "archetype" TEXT,
    "score" TEXT,
    "cvMatchPct" INTEGER,
    "evalReport" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GeneratedResume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneratedResume_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_url_key" ON "Job"("url");
