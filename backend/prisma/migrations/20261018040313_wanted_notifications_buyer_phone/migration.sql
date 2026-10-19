-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WANTED_ITEM_MATCH');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneNumber" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT,
    "wantedItemId" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'WANTED_ITEM_MATCH',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_listingId_idx" ON "Notification"("listingId");

-- CreateIndex
CREATE INDEX "Notification_wantedItemId_idx" ON "Notification"("wantedItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_listingId_wantedItemId_key" ON "Notification"("userId", "listingId", "wantedItemId");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_wantedItemId_fkey" FOREIGN KEY ("wantedItemId") REFERENCES "WantedItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
