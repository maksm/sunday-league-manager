-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "badge" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "motmCount" INTEGER NOT NULL DEFAULT 0,
    "form" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "teamId" TEXT,
    CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("assists", "form", "goals", "id", "isActive", "matchesPlayed", "motmCount", "name", "userId") SELECT "assists", "form", "goals", "id", "isActive", "matchesPlayed", "motmCount", "name", "userId" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");
CREATE INDEX "Player_name_idx" ON "Player"("name");
CREATE INDEX "Player_isActive_idx" ON "Player"("isActive");
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE INDEX "Team_name_idx" ON "Team"("name");

-- CreateIndex
CREATE INDEX "Matchday_date_idx" ON "Matchday"("date");

-- CreateIndex
CREATE INDEX "Matchday_status_idx" ON "Matchday"("status");

-- CreateIndex
CREATE INDEX "Matchday_seasonId_idx" ON "Matchday"("seasonId");

-- CreateIndex
CREATE INDEX "Season_startDate_idx" ON "Season"("startDate");

-- CreateIndex
CREATE INDEX "Season_endDate_idx" ON "Season"("endDate");
