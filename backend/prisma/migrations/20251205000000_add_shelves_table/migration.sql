-- CreateTable
CREATE TABLE "shelves" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shelves_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "shelves_code_key" ON "shelves"("code");

-- CreateIndex
CREATE UNIQUE INDEX "shelves_locationId_code_key" ON "shelves"("locationId", "code");

-- AlterTable: Agregar columna shelfId a location_attributes
ALTER TABLE "location_attributes" ADD COLUMN "shelfId" TEXT;

-- AddForeignKey
ALTER TABLE "location_attributes" ADD CONSTRAINT "location_attributes_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "shelves"("id") ON DELETE CASCADE ON UPDATE CASCADE;
