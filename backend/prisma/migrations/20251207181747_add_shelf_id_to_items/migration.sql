-- AlterTable
ALTER TABLE "items" ADD COLUMN     "shelfId" TEXT;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "shelves"("id") ON DELETE SET NULL ON UPDATE CASCADE;
