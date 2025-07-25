/*
  Warnings:

  - You are about to drop the column `integrations` on the `product_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product_profiles" DROP COLUMN "integrations",
ADD COLUMN     "currentPrice" TEXT,
ADD COLUMN     "currentPricingModel" TEXT,
ADD COLUMN     "market" TEXT;
