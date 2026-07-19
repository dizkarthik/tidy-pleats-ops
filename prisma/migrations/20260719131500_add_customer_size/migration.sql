-- CreateEnum
CREATE TYPE "CustomerSize" AS ENUM ('S', 'M', 'L', 'XL', 'XXL');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN "size" "CustomerSize";
