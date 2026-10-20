/*
  Warnings:

  - You are about to drop the column `changedById` on the `order_status_history` table. All the data in the column will be lost.
  - Added the required column `changedBy` to the `order_status_history` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "order_status_history_changedById_idx";

-- AlterTable
ALTER TABLE "order_status_history" DROP COLUMN "changedById",
ADD COLUMN     "changedBy" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "order_status_history_changedBy_idx" ON "order_status_history"("changedBy");
