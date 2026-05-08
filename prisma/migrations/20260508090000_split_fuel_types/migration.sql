ALTER TABLE "FuelPurchase" ADD COLUMN "fuelType" TEXT NOT NULL DEFAULT 'Diesel';
ALTER TABLE "FuelAllocation" ADD COLUMN "fuelType" TEXT NOT NULL DEFAULT 'Diesel';

UPDATE "FuelAllocation"
SET "fuelType" = "Vehicle"."fuelType"
FROM "Vehicle"
WHERE "FuelAllocation"."vehicleId" = "Vehicle"."id";

WITH allocation_balances AS (
  SELECT
    "id",
    COALESCE((
      SELECT SUM("litres")
      FROM "FuelPurchase"
      WHERE "FuelPurchase"."fuelType" = "FuelAllocation"."fuelType"
        AND "FuelPurchase"."purchasedAt" <= "FuelAllocation"."issuedAt"
    ), 0) - SUM("litres") OVER (
      PARTITION BY "fuelType"
      ORDER BY "issuedAt", "createdAt", "id"
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS "remainingStockLitres"
  FROM "FuelAllocation"
)
UPDATE "FuelAllocation"
SET "remainingStockLitres" = allocation_balances."remainingStockLitres"
FROM allocation_balances
WHERE "FuelAllocation"."id" = allocation_balances."id";

CREATE INDEX "FuelPurchase_fuelType_idx" ON "FuelPurchase"("fuelType");
CREATE INDEX "FuelAllocation_fuelType_idx" ON "FuelAllocation"("fuelType");
