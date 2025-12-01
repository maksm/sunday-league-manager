-- CreateTable
CREATE TABLE "MatchdayTeam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "matchdayId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MatchdayTeam_matchdayId_fkey" FOREIGN KEY ("matchdayId") REFERENCES "Matchday" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_MatchdayTeamToPlayer" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MatchdayTeamToPlayer_A_fkey" FOREIGN KEY ("A") REFERENCES "MatchdayTeam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MatchdayTeamToPlayer_B_fkey" FOREIGN KEY ("B") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_MatchdayTeamToPlayer_AB_unique" ON "_MatchdayTeamToPlayer"("A", "B");

-- CreateIndex
CREATE INDEX "_MatchdayTeamToPlayer_B_index" ON "_MatchdayTeamToPlayer"("B");
