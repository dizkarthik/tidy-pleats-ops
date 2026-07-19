-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('SINGLE', 'MULTI');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('ONE_TIME', 'MULTIPLE');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'RUPEE');

-- CreateEnum
CREATE TYPE "AdvancePaymentMethod" AS ENUM ('CASH', 'UPI');

-- CreateEnum
CREATE TYPE "PickupDrop" AS ENUM ('NO', 'PICKUP', 'DROP', 'PICKUP_AND_DROP');

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderType" "OrderType" NOT NULL,
    "deliveryType" "DeliveryType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountType" "DiscountType" NOT NULL DEFAULT 'RUPEE',
    "advancePaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "advancePaymentMethod" "AdvancePaymentMethod" NOT NULL DEFAULT 'CASH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "sareeNumber" INTEGER NOT NULL,
    "palluPleats" INTEGER NOT NULL,
    "centerPleats" INTEGER NOT NULL,
    "photoUrl" TEXT,
    "sareeNotes" TEXT,
    "damageNoticed" BOOLEAN NOT NULL DEFAULT false,
    "damageNotes" TEXT,
    "informedToCustomer" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(10,2) NOT NULL,
    "neededBy" DATE NOT NULL,
    "pickupDrop" "PickupDrop" NOT NULL DEFAULT 'NO',
    "address" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");

-- CreateIndex
CREATE INDEX "orders_orderDate_idx" ON "orders"("orderDate");

-- CreateIndex
CREATE INDEX "orders_orderType_idx" ON "orders"("orderType");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_orderId_sareeNumber_key" ON "order_items"("orderId", "sareeNumber");

-- CreateIndex
CREATE INDEX "order_items_neededBy_idx" ON "order_items"("neededBy");

-- CreateIndex
CREATE INDEX "order_items_pickupDrop_idx" ON "order_items"("pickupDrop");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
