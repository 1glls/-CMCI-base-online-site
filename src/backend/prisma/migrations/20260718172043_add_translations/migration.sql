-- CreateTable
CREATE TABLE "translation_providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "service" TEXT NOT NULL DEFAULT 'deepl',
    "apiKey" TEXT NOT NULL,
    "characterLimit" INTEGER NOT NULL DEFAULT 500000,
    "charactersUsed" INTEGER NOT NULL DEFAULT 0,
    "remoteUsed" INTEGER,
    "remoteLimit" INTEGER,
    "lastCheckedAt" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "exhausted" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "content_translations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "model" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "auto" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "content_translations_model_recordId_language_idx" ON "content_translations"("model", "recordId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "content_translations_model_recordId_language_field_key" ON "content_translations"("model", "recordId", "language", "field");
