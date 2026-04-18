-- CreateEnum
CREATE TYPE "SessionDeviceType" AS ENUM ('ios', 'android', 'macos', 'windows', 'linux', 'web', 'unknown');

-- DropIndex
DROP INDEX IF EXISTS "sessions_userId_clientInstanceId_key";

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "client_instance_id";

-- Токены до миграции недействительны (новая модель сессии)
DELETE FROM "sessions";

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "device_type" "SessionDeviceType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "sessions_userId_deviceType_key" ON "sessions"("userId", "device_type");
