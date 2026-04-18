-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "client_instance_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sessions_userId_clientInstanceId_key" ON "sessions"("userId", "client_instance_id");
