import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { roundNumber, toNumber } from "@/lib/number";
import type { ReconciliationRow } from "@/lib/types";

export async function getCurrentStockLitres(fuelType: string): Promise<number> {
  const [purchases, allocations] = await Promise.all([
    prisma.fuelPurchase.aggregate({ where: { fuelType }, _sum: { litres: true } }),
    prisma.fuelAllocation.aggregate({ where: { fuelType }, _sum: { litres: true } })
  ]);

  return roundNumber(toNumber(purchases._sum.litres) - toNumber(allocations._sum.litres));
}

export async function getStockBefore(date: Date, fuelType: string): Promise<number> {
  const [purchases, allocations] = await Promise.all([
    prisma.fuelPurchase.aggregate({
      where: { fuelType, purchasedAt: { lt: date } },
      _sum: { litres: true }
    }),
    prisma.fuelAllocation.aggregate({
      where: { fuelType, issuedAt: { lt: date } },
      _sum: { litres: true }
    })
  ]);

  return roundNumber(toNumber(purchases._sum.litres) - toNumber(allocations._sum.litres));
}

export async function getReconciliationRows(start: Date, end: Date): Promise<ReconciliationRow[]> {
  const [vehicles, allocationGroups, mileageGroups] = await Promise.all([
    prisma.vehicle.findMany({
      where: { active: true },
      include: { driver: true },
      orderBy: { registrationNumber: "asc" }
    }),
    prisma.fuelAllocation.groupBy({
      by: ["vehicleId"],
      where: { issuedAt: { gte: start, lt: end } },
      _sum: { litres: true },
      _count: { id: true }
    }),
    prisma.mileageLog.groupBy({
      by: ["vehicleId"],
      where: { recordedAt: { gte: start, lt: end } },
      _sum: { distanceKm: true },
      _count: { id: true }
    })
  ]);

  const allocationMap = new Map(
    allocationGroups.map((row) => [row.vehicleId, { litres: toNumber(row._sum.litres), count: row._count.id }])
  );
  const mileageMap = new Map(
    mileageGroups.map((row) => [row.vehicleId, { distanceKm: toNumber(row._sum.distanceKm), count: row._count.id }])
  );

  return vehicles.map((vehicle) => {
    const allocatedLitres = allocationMap.get(vehicle.id)?.litres ?? 0;
    const distanceKm = mileageMap.get(vehicle.id)?.distanceKm ?? 0;
    const expectedKmPerLitre = toNumber(vehicle.expectedKmPerLitre);
    const tolerancePercent = toNumber(vehicle.anomalyTolerancePercent);
    const expectedLitres = expectedKmPerLitre > 0 ? distanceKm / expectedKmPerLitre : 0;
    const actualKmPerLitre = allocatedLitres > 0 ? distanceKm / allocatedLitres : null;
    const varianceLitres = allocatedLitres - expectedLitres;
    const variancePercent = expectedLitres > 0 ? (varianceLitres / expectedLitres) * 100 : null;

    let anomaly = false;
    let anomalyReason = "Within tolerance";

    if (allocatedLitres > 0 && distanceKm === 0) {
      anomaly = true;
      anomalyReason = "Fuel issued with no recorded mileage";
    } else if (variancePercent !== null && variancePercent > tolerancePercent) {
      anomaly = true;
      anomalyReason = `Fuel usage exceeds expected consumption by ${roundNumber(variancePercent)}%`;
    } else if (allocatedLitres === 0 && distanceKm > 0) {
      anomaly = true;
      anomalyReason = "Mileage recorded with no matching fuel allocation";
    }

    return {
      vehicleId: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      fuelType: vehicle.fuelType,
      driverName: vehicle.driver?.name ?? "Unassigned",
      department: vehicle.department,
      expectedKmPerLitre: roundNumber(expectedKmPerLitre),
      tolerancePercent: roundNumber(tolerancePercent),
      allocatedLitres: roundNumber(allocatedLitres),
      distanceKm: roundNumber(distanceKm),
      expectedLitres: roundNumber(expectedLitres),
      actualKmPerLitre: actualKmPerLitre === null ? null : roundNumber(actualKmPerLitre),
      varianceLitres: roundNumber(varianceLitres),
      variancePercent: variancePercent === null ? null : roundNumber(variancePercent),
      anomaly,
      anomalyReason
    };
  });
}

export function dateWhere<TField extends string>(field: TField, start: Date, end: Date) {
  return {
    [field]: {
      gte: start,
      lt: end
    }
  } as Record<TField, Prisma.DateTimeFilter>;
}
