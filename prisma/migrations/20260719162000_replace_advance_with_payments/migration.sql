-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "AdvancePaymentMethod" NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- Migrate legacy advance payments into the transaction log. The seeded app has
-- exactly two users; picking the oldest user is a best-effort recorded-by value
-- for historical data where the original recorder was not tracked.
INSERT INTO "payments" (
    "id",
    "orderId",
    "amount",
    "method",
    "paymentDate",
    "recordedById",
    "notes"
)
SELECT
    'migrated_advance_' || "orders"."id",
    "orders"."id",
    "orders"."advancePaid",
    "orders"."advancePaymentMethod",
    "orders"."orderDate",
    (SELECT "users"."id" FROM "users" ORDER BY "users"."createdAt" ASC LIMIT 1),
    'Migrated from legacy Advance Paid field.'
FROM "orders"
WHERE "orders"."advancePaid" > 0
  AND EXISTS (SELECT 1 FROM "users");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_recordedById_idx" ON "payments"("recordedById");

-- CreateIndex
CREATE INDEX "payments_paymentDate_idx" ON "payments"("paymentDate");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "advancePaid",
DROP COLUMN "advancePaymentMethod";
