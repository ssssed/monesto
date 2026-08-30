-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tracking_started_at" DATE;

-- CreateTable
CREATE TABLE "cycle_carryovers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "cycle_key" TEXT NOT NULL,
    "amount_rub" DECIMAL(65,30) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_carryovers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cycle_carryovers_user_id_idx" ON "cycle_carryovers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_carryovers_user_id_cycle_key_key" ON "cycle_carryovers"("user_id", "cycle_key");

-- AddForeignKey
ALTER TABLE "cycle_carryovers" ADD CONSTRAINT "cycle_carryovers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
