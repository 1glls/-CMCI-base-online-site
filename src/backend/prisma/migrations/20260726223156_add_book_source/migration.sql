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
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_books" ("author", "cover", "createdAt", "description", "externalLink", "featured", "file", "id", "order", "preview", "status", "title", "updatedAt") SELECT "author", "cover", "createdAt", "description", "externalLink", "featured", "file", "id", "order", "preview", "status", "title", "updatedAt" FROM "books";
DROP TABLE "books";
ALTER TABLE "new_books" RENAME TO "books";
CREATE UNIQUE INDEX "books_source_sourceId_key" ON "books"("source", "sourceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
