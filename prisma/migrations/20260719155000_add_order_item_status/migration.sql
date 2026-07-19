-- CreateEnum
CREATE TYPE "OrderItemStatus" AS ENUM ('BOOKED', 'COLLECTED', 'IN_PROGRESS', 'QUALITY_CHECK', 'READY', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "status" "OrderItemStatus" NOT NULL DEFAULT 'BOOKED',
ADD COLUMN "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "order_item_status_history" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "status" "OrderItemStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedById" TEXT NOT NULL,

    CONSTRAINT "order_item_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_items_status_idx" ON "order_items"("status");

-- CreateIndex
CREATE INDEX "order_item_status_history_orderItemId_idx" ON "order_item_status_history"("orderItemId");

-- CreateIndex
CREATE INDEX "order_item_status_history_changedById_idx" ON "order_item_status_history"("changedById");

-- CreateIndex
CREATE INDEX "order_item_status_history_status_idx" ON "order_item_status_history"("status");

-- AddForeignKey
ALTER TABLE "order_item_status_history" ADD CONSTRAINT "order_item_status_history_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_status_history" ADD CONSTRAINT "order_item_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
