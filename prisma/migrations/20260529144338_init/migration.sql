-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED');

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thickness" (
    "id" SERIAL NOT NULL,
    "materialId" INTEGER NOT NULL,
    "valore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Thickness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Price" (
    "id" SERIAL NOT NULL,
    "thicknessId" INTEGER NOT NULL,
    "quotaFissaEur" DOUBLE PRECISION NOT NULL,
    "costoPerMetroEur" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "azienda" TEXT,
    "pIva" TEXT,
    "note" TEXT,
    "materialId" INTEGER NOT NULL,
    "thicknessId" INTEGER NOT NULL,
    "quantita" INTEGER NOT NULL,
    "metriLineari" DOUBLE PRECISION NOT NULL,
    "prezzoTotale" DOUBLE PRECISION NOT NULL,
    "dxfKey" TEXT NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_slug_key" ON "Material"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Thickness_materialId_valore_key" ON "Thickness"("materialId", "valore");

-- CreateIndex
CREATE UNIQUE INDEX "Price_thicknessId_key" ON "Price"("thicknessId");

-- AddForeignKey
ALTER TABLE "Thickness" ADD CONSTRAINT "Thickness_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_thicknessId_fkey" FOREIGN KEY ("thicknessId") REFERENCES "Thickness"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_thicknessId_fkey" FOREIGN KEY ("thicknessId") REFERENCES "Thickness"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
