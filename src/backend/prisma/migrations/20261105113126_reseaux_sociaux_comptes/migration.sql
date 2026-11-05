-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "credentials" TEXT NOT NULL DEFAULT '{}',
    "accessExpiresAt" DATETIME,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" DATETIME,
    "lastCount" INTEGER,
    "lastError" TEXT,
    "accountName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_social_media_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "content" TEXT,
    "mediaUrl" TEXT,
    "thumbnailUrl" TEXT,
    "author" TEXT,
    "publishedAt" DATETIME,
    "title" TEXT,
    "localThumbnail" TEXT,
    "isVideo" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "validatedBy" TEXT,
    "validatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_social_media_posts" ("author", "content", "createdAt", "id", "mediaUrl", "platform", "postId", "publishedAt", "status", "thumbnailUrl", "updatedAt", "validatedAt", "validatedBy") SELECT "author", "content", "createdAt", "id", "mediaUrl", "platform", "postId", "publishedAt", "status", "thumbnailUrl", "updatedAt", "validatedAt", "validatedBy" FROM "social_media_posts";
DROP TABLE "social_media_posts";
ALTER TABLE "new_social_media_posts" RENAME TO "social_media_posts";
CREATE UNIQUE INDEX "social_media_posts_postId_key" ON "social_media_posts"("postId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_platform_key" ON "social_accounts"("platform");
