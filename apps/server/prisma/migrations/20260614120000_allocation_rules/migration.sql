-- CreateEnum
CREATE TYPE "AllocationTopUpType" AS ENUM ('percent', 'fixed_amount', 'quantity');

-- CreateTable
CREATE TABLE "allocation_rules" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,
    "top_up_type" "AllocationTopUpType" NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "execution_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allocation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "allocation_rules_userId_idx" ON "allocation_rules"("userId");

-- CreateIndex
CREATE INDEX "allocation_rules_userId_assetId_idx" ON "allocation_rules"("userId", "assetId");

-- AddForeignKey
ALTER TABLE "allocation_rules" ADD CONSTRAINT "allocation_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_rules" ADD CONSTRAINT "allocation_rules_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
