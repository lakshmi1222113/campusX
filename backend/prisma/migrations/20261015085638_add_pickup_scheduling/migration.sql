-- CreateEnum
CREATE TYPE "PickupScheduleStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'RESCHEDULE_REQUESTED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "pickupConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "pickupScheduleStatus" "PickupScheduleStatus",
ADD COLUMN     "pickupScheduledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_pickupScheduledAt_idx" ON "Order"("pickupScheduledAt");
