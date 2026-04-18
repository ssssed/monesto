-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('BASE', 'PRICED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "MandatoryBreakdownLineKind" AS ENUM ('UNALLOCATED', 'CUSTOM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetIcon" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,

    CONSTRAINT "AssetIcon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "AssetKind" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DECIMAL(19,4) NOT NULL,
    "unit" TEXT,
    "count" DECIMAL(24,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetTransaction" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price" DECIMAL(19,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "count" DECIMAL(24,8) NOT NULL,

    CONSTRAINT "AssetTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "incomingAmount" DECIMAL(19,4),
    "mandatoryAmount" DECIMAL(19,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthPlanMandatoryLine" (
    "id" TEXT NOT NULL,
    "monthPlanId" TEXT NOT NULL,
    "kind" "MandatoryBreakdownLineKind" NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MonthPlanMandatoryLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetIcon_assetId_key" ON "AssetIcon"("assetId");

-- CreateIndex
CREATE INDEX "Asset_userId_idx" ON "Asset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_userId_slug_key" ON "Asset"("userId", "slug");

-- CreateIndex
CREATE INDEX "AssetTransaction_assetId_occurredAt_idx" ON "AssetTransaction"("assetId", "occurredAt");

-- CreateIndex
CREATE INDEX "MonthPlan_userId_idx" ON "MonthPlan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthPlan_userId_year_month_key" ON "MonthPlan"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "MonthPlanMandatoryLine_monthPlanId_idx" ON "MonthPlanMandatoryLine"("monthPlanId");

-- AddForeignKey
ALTER TABLE "AssetIcon" ADD CONSTRAINT "AssetIcon_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransaction" ADD CONSTRAINT "AssetTransaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthPlan" ADD CONSTRAINT "MonthPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthPlanMandatoryLine" ADD CONSTRAINT "MonthPlanMandatoryLine_monthPlanId_fkey" FOREIGN KEY ("monthPlanId") REFERENCES "MonthPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
