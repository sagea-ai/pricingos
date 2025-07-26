-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('STRIPE', 'KHALTI');

-- AlterTable
ALTER TABLE "product_profiles" ADD COLUMN     "averagePrice" DOUBLE PRECISION,
ADD COLUMN     "businessStage" TEXT DEFAULT 'idea',
ADD COLUMN     "isEstimate" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "trigger_settings" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "financial_metrics" (
    "id" TEXT NOT NULL,
    "productProfileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyRecurringRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "oneTimePayments" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageRevenuePerUser" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activeSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "revenueGrowthRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mrrGrowthRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subscriptionGrowthRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyBurnRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyBurnRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netDailyBurn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "runwayMonths" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "runwayDays" INTEGER NOT NULL DEFAULT 0,
    "projectedCashDepletion" TIMESTAMP(3),
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "financial_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gateway_connections" (
    "id" TEXT NOT NULL,
    "productProfileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gateway" "PaymentGateway" NOT NULL,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "lastSync" TIMESTAMP(3),
    "syncStatus" TEXT,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gateway_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trigger_event_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "triggerData" JSONB NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trigger_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gateway_connections_productProfileId_gateway_key" ON "gateway_connections"("productProfileId", "gateway");

-- AddForeignKey
ALTER TABLE "financial_metrics" ADD CONSTRAINT "financial_metrics_productProfileId_fkey" FOREIGN KEY ("productProfileId") REFERENCES "product_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_metrics" ADD CONSTRAINT "financial_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_connections" ADD CONSTRAINT "gateway_connections_productProfileId_fkey" FOREIGN KEY ("productProfileId") REFERENCES "product_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_connections" ADD CONSTRAINT "gateway_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
