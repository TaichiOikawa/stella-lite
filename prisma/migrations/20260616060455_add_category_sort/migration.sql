-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Category_order_idx" ON "Category"("order");
