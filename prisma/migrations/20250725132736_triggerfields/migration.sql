-- CreateEnum
CREATE TYPE "TriggerCategory" AS ENUM ('FINANCIAL', 'USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TriggerSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "trigger_settings" (
    "id" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TriggerCategory" NOT NULL,
    "severity" "TriggerSeverity" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailTemplate" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trigger_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trigger_email_logs" (
    "id" TEXT NOT NULL,
    "triggerSettingId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "emailTemplate" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "resendId" TEXT,

    CONSTRAINT "trigger_email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trigger_settings_triggerId_organizationId_key" ON "trigger_settings"("triggerId", "organizationId");

-- AddForeignKey
ALTER TABLE "trigger_settings" ADD CONSTRAINT "trigger_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trigger_email_logs" ADD CONSTRAINT "trigger_email_logs_triggerSettingId_fkey" FOREIGN KEY ("triggerSettingId") REFERENCES "trigger_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
