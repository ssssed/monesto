-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "assets_userId_idx" ON "assets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "assets_userId_slug_key" ON "assets"("userId", "slug");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "sessions_userId_deviceType_key" RENAME TO "sessions_userId_device_type_key";
