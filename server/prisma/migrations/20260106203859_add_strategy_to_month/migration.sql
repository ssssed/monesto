/*
  Warnings:

  - Added the required column `strategyName` to the `user_months` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_months" ADD COLUMN     "strategyName" TEXT NOT NULL;
