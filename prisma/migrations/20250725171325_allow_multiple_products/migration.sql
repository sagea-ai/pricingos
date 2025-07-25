-- DropIndex
DROP INDEX "product_profiles_userId_key";

-- AlterTable
ALTER TABLE "product_profiles" ADD COLUMN     "churnRate" DOUBLE PRECISION,
ADD COLUMN     "monthlyRevenue" DOUBLE PRECISION,
ADD COLUMN     "paymentIntegrations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "totalUsers" INTEGER DEFAULT 0,
ADD COLUMN     "userType" TEXT DEFAULT 'Self-serve';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "activeProductProfileId" TEXT;

-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "pricingModel" TEXT,
    "startingPrice" TEXT,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "market" TEXT,
    "fundingStage" TEXT,
    "targetSize" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_competitors" (
    "id" TEXT NOT NULL,
    "productProfileId" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "isDirectCompetitor" BOOLEAN NOT NULL DEFAULT true,
    "similarityScore" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_analyses" (
    "id" TEXT NOT NULL,
    "productProfileId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "insights" JSONB NOT NULL,
    "marketPosition" JSONB,
    "competitorMatrix" JSONB,
    "abTestScenarios" JSONB,
    "confidenceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_competitors_productProfileId_competitorId_key" ON "product_competitors"("productProfileId", "competitorId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_activeProductProfileId_fkey" FOREIGN KEY ("activeProductProfileId") REFERENCES "product_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_competitors" ADD CONSTRAINT "product_competitors_productProfileId_fkey" FOREIGN KEY ("productProfileId") REFERENCES "product_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_competitors" ADD CONSTRAINT "product_competitors_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_analyses" ADD CONSTRAINT "pricing_analyses_productProfileId_fkey" FOREIGN KEY ("productProfileId") REFERENCES "product_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
