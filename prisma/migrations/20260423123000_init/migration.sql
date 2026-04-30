-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ACCOUNTANT', 'OPERATIONS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATIONS',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "employeeNumber" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "licenseNumber" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL DEFAULT 'Diesel',
    "tankCapacityLitres" DECIMAL(10,2),
    "expectedKmPerLitre" DECIMAL(8,2) NOT NULL,
    "anomalyTolerancePercent" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "currentOdometerKm" DECIMAL(12,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "driverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelPurchase" (
    "id" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL,
    "litres" DECIMAL(12,2) NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "totalCost" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelAllocation" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "litres" DECIMAL(12,2) NOT NULL,
    "odometerKm" DECIMAL(12,2) NOT NULL,
    "voucherNumber" TEXT,
    "purpose" TEXT NOT NULL,
    "destination" TEXT,
    "remainingStockLitres" DECIMAL(12,2) NOT NULL,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MileageLog" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "odometerKm" DECIMAL(12,2) NOT NULL,
    "distanceKm" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MileageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_employeeNumber_key" ON "Driver"("employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_registrationNumber_key" ON "Vehicle"("registrationNumber");

-- CreateIndex
CREATE INDEX "Vehicle_driverId_idx" ON "Vehicle"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "FuelPurchase_invoiceNumber_key" ON "FuelPurchase"("invoiceNumber");

-- CreateIndex
CREATE INDEX "FuelPurchase_purchasedAt_idx" ON "FuelPurchase"("purchasedAt");

-- CreateIndex
CREATE INDEX "FuelPurchase_createdById_idx" ON "FuelPurchase"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "FuelAllocation_voucherNumber_key" ON "FuelAllocation"("voucherNumber");

-- CreateIndex
CREATE INDEX "FuelAllocation_vehicleId_idx" ON "FuelAllocation"("vehicleId");

-- CreateIndex
CREATE INDEX "FuelAllocation_issuedAt_idx" ON "FuelAllocation"("issuedAt");

-- CreateIndex
CREATE INDEX "FuelAllocation_recordedById_idx" ON "FuelAllocation"("recordedById");

-- CreateIndex
CREATE INDEX "MileageLog_vehicleId_idx" ON "MileageLog"("vehicleId");

-- CreateIndex
CREATE INDEX "MileageLog_recordedAt_idx" ON "MileageLog"("recordedAt");

-- CreateIndex
CREATE INDEX "MileageLog_recordedById_idx" ON "MileageLog"("recordedById");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelPurchase" ADD CONSTRAINT "FuelPurchase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelAllocation" ADD CONSTRAINT "FuelAllocation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelAllocation" ADD CONSTRAINT "FuelAllocation_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MileageLog" ADD CONSTRAINT "MileageLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MileageLog" ADD CONSTRAINT "MileageLog_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
