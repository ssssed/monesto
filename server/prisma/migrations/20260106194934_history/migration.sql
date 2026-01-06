/*
  Warnings:

  - You are about to drop the column `incoming` on the `user_months` table. All the data in the column will be lost.
  - You are about to drop the column `mandatory` on the `user_months` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_months" DROP COLUMN "incoming",
DROP COLUMN "mandatory",
ADD COLUMN     "incomingAmount" DECIMAL(65,30),
ADD COLUMN     "incomingCurrency" TEXT,
ADD COLUMN     "mandatoryAmount" DECIMAL(65,30),
ADD COLUMN     "mandatoryCurrency" TEXT;

-- CreateTable
CREATE TABLE "user_month_savings_history" (
    "id" TEXT NOT NULL,
    "userMonthId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_month_savings_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_month_savings_history" ADD CONSTRAINT "user_month_savings_history_userMonthId_fkey" FOREIGN KEY ("userMonthId") REFERENCES "user_months"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
