-- CreateEnum (if not exists)
DO $$ BEGIN
    CREATE TYPE "AttributeType" AS ENUM ('TEXT', 'NUMBER', 'SELECT', 'DATE', 'BOOLEAN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "category_attributes" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "AttributeType" NOT NULL DEFAULT 'TEXT',
    "options" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "category_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "category_attributes_categoryId_key_key" ON "category_attributes"("categoryId", "key");

-- AddForeignKey (if not exists)
DO $$ BEGIN
    ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_categoryId_fkey" 
    FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
