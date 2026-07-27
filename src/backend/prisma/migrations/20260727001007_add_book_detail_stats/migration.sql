-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_books" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT NOT NULL,
    "cover" TEXT,
    "file" TEXT,
    "preview" TEXT,
    "externalLink" TEXT,
    "source" TEXT DEFAULT 'local',
    "sourceId" TEXT,
    "language" TEXT,
    "languageCode" TEXT,
    "priceLabel" TEXT,
    "coverKey" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "workKey" TEXT,
    "pages" INTEGER,
    "readMinutes" INTEGER,
    "publisherName" TEXT,
    "discountPercentage" REAL,
    "sourceDownloads" INTEGER,
    "sourceLikes" INTEGER,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_books" ("author", "cover", "coverKey", "createdAt", "description", "externalLink", "featured", "file", "hidden", "id", "language", "languageCode", "order", "preview", "priceLabel", "source", "sourceId", "status", "title", "updatedAt") SELECT "author", "cover", "coverKey", "createdAt", "description", "externalLink", "featured", "file", "hidden", "id", "language", "languageCode", "order", "preview", "priceLabel", "source", "sourceId", "status", "title", "updatedAt" FROM "books";
DROP TABLE "books";
ALTER TABLE "new_books" RENAME TO "books";
CREATE INDEX "books_workKey_idx" ON "books"("workKey");
CREATE UNIQUE INDEX "books_source_sourceId_key" ON "books"("source", "sourceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
