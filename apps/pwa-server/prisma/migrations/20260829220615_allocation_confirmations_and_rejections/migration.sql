-- CreateTable
CREATE TABLE "allocation_confirmations" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rule_id" INTEGER NOT NULL,
    "cycle_key" TEXT NOT NULL,
    "amount_rub" DECIMAL(65,30) NOT NULL,
    "confirmed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocation_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocation_rejections" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rule_id" INTEGER NOT NULL,
    "cycle_key" TEXT NOT NULL,
    "rejected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocation_rejections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "allocation_confirmations_user_id_cycle_key_idx" ON "allocation_confirmations"("user_id", "cycle_key");

-- CreateIndex
CREATE UNIQUE INDEX "allocation_confirmations_rule_id_cycle_key_key" ON "allocation_confirmations"("rule_id", "cycle_key");

-- CreateIndex
CREATE INDEX "allocation_rejections_user_id_cycle_key_idx" ON "allocation_rejections"("user_id", "cycle_key");

-- CreateIndex
CREATE UNIQUE INDEX "allocation_rejections_rule_id_cycle_key_key" ON "allocation_rejections"("rule_id", "cycle_key");

-- AddForeignKey
ALTER TABLE "allocation_confirmations" ADD CONSTRAINT "allocation_confirmations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_confirmations" ADD CONSTRAINT "allocation_confirmations_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "distribution_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_rejections" ADD CONSTRAINT "allocation_rejections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_rejections" ADD CONSTRAINT "allocation_rejections_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "distribution_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
