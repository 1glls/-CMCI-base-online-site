-- CreateTable
CREATE TABLE "link_checks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sourceModel" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL DEFAULT '',
    "field" TEXT NOT NULL,
    "label" TEXT,
    "adminHref" TEXT,
    "status" INTEGER,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "firstFailedAt" DATETIME,
    "lastCheckedAt" DATETIME,
    "ignored" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "link_checks_state_idx" ON "link_checks"("state");

-- CreateIndex
CREATE UNIQUE INDEX "link_checks_sourceModel_sourceId_field_url_key" ON "link_checks"("sourceModel", "sourceId", "field", "url");
