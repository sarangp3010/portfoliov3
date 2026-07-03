-- CreateEnum
CREATE TYPE "InquiryStage" AS ENUM ('NEW', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST');

-- DropForeignKey
ALTER TABLE "CustomerMessage" DROP CONSTRAINT "CustomerMessage_customerId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerSession" DROP CONSTRAINT "CustomerSession_customerId_fkey";

-- AlterTable
ALTER TABLE "BlogPost" ALTER COLUMN "tags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CustomerMessage" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EmailTemplate" ALTER COLUMN "variables" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "stage" "InquiryStage" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "stageUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PageSection" ALTER COLUMN "sectionType" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "skills" DROP DEFAULT,
ALTER COLUMN "techStack" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "techStack" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "features" DROP DEFAULT;

-- AlterTable
ALTER TABLE "VisitorSession" ALTER COLUMN "navigationPath" DROP DEFAULT;

-- CreateTable
CREATE TABLE "InquiryStageHistory" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "from" "InquiryStage",
    "to" "InquiryStage" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InquiryStageHistory_inquiryId_idx" ON "InquiryStageHistory"("inquiryId");

-- CreateIndex
CREATE INDEX "InquiryStageHistory_createdAt_idx" ON "InquiryStageHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Inquiry_stage_idx" ON "Inquiry"("stage");

-- AddForeignKey
ALTER TABLE "InquiryStageHistory" ADD CONSTRAINT "InquiryStageHistory_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSession" ADD CONSTRAINT "CustomerSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMessage" ADD CONSTRAINT "CustomerMessage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Notification_recipient_date_idx" RENAME TO "Notification_recipientType_recipientId_createdAt_idx";

-- RenameIndex
ALTER INDEX "Notification_recipient_read_idx" RENAME TO "Notification_recipientType_recipientId_isRead_idx";

-- RenameIndex
ALTER INDEX "PageSection_page_visible_idx" RENAME TO "PageSection_page_isVisible_order_idx";
