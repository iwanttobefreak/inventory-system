-- AlterTable location_attributes: Hacer locationId opcional
ALTER TABLE "location_attributes" ALTER COLUMN "locationId" DROP NOT NULL;

-- DropIndex: Eliminar el índice único compuesto ya que locationId puede ser NULL
DROP INDEX IF EXISTS "location_attributes_locationId_code_key";
