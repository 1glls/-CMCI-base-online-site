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
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_books" ("author", "cover", "createdAt", "description", "externalLink", "file", "id", "order", "preview", "status", "title", "updatedAt") SELECT "author", "cover", "createdAt", "description", "externalLink", "file", "id", "order", "preview", "status", "title", "updatedAt" FROM "books";
DROP TABLE "books";
ALTER TABLE "new_books" RENAME TO "books";
CREATE TABLE "new_tracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cover" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_tracts" ("cover", "createdAt", "description", "id", "order", "slug", "status", "title", "updatedAt") SELECT "cover", "createdAt", "description", "id", "order", "slug", "status", "title", "updatedAt" FROM "tracts";
DROP TABLE "tracts";
ALTER TABLE "new_tracts" RENAME TO "tracts";
CREATE UNIQUE INDEX "tracts_slug_key" ON "tracts"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
