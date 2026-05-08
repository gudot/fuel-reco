import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireApiUser } from "@/lib/api";
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "@/lib/dates";
import { getCurrentStockLitres, getReconciliationRows } from "@/lib/reconciliation";
import { roundNumber, toNumber } from "@/lib/number";
import { serializeAllocation, serializePurchase } from "@/lib/serializers";

export const dynamic = "force-dynamic";
const FUEL_TYPES = ["Diesel", "Petrol"] as const;

function fuelSum(rows: Array<{ fuelType: string; _sum: { litres: unknown } }>, fuelType: string) {
  return roundNumber(toNumber(rows.find((row) => row.fuelType === fuelType)?._sum.litres));
}

export async function GET() {
  try {
    await requireApiUser();
    const todayStart = startOfDay();
    const todayEnd = endOfDay();
    const monthStart = startOfMonth();
    const monthEnd = endOfMonth();
    const trendStart = new Date(todayStart);
    trendStart.setDate(trendStart.getDate() - 29);

    const [
      dieselStockLitres,
      petrolStockLitres,
      monthPurchases,
      monthAllocations,
      todayAllocations,
      activeVehicles,
      monthlyRows,
      recentAllocations,
      recentPurchases,
      trendAllocationsRaw
    ] = await Promise.all([
      getCurrentStockLitres("Diesel"),
      getCurrentStockLitres("Petrol"),
      prisma.fuelPurchase.groupBy({
        by: ["fuelType"],
        where: { fuelType: { in: [...FUEL_TYPES] }, purchasedAt: { gte: monthStart, lt: monthEnd } },
        _sum: { litres: true }
      }),
      prisma.fuelAllocation.groupBy({
        by: ["fuelType"],
        where: { fuelType: { in: [...FUEL_TYPES] }, issuedAt: { gte: monthStart, lt: monthEnd } },
        _sum: { litres: true }
      }),
      prisma.fuelAllocation.groupBy({
        by: ["fuelType"],
        where: { fuelType: { in: [...FUEL_TYPES] }, issuedAt: { gte: todayStart, lt: todayEnd } },
        _sum: { litres: true }
      }),
      prisma.vehicle.count({ where: { active: true } }),
      getReconciliationRows(monthStart, monthEnd),
      prisma.fuelAllocation.findMany({
        include: {
          vehicle: { select: { registrationNumber: true, fuelType: true } },
          recordedBy: { select: { name: true, email: true } }
        },
        orderBy: { issuedAt: "desc" },
        take: 8
      }),
      prisma.fuelPurchase.findMany({
        include: { createdBy: { select: { name: true, email: true } } },
        orderBy: { purchasedAt: "desc" },
        take: 5
      }),
      prisma.fuelAllocation.findMany({
        where: { fuelType: { in: [...FUEL_TYPES] }, issuedAt: { gte: trendStart, lt: todayEnd } },
        select: { issuedAt: true, fuelType: true, litres: true },
        orderBy: { issuedAt: "asc" }
      })
    ]);

    const trendMap = new Map<string, { dieselLitres: number; petrolLitres: number }>();
    for (let date = new Date(trendStart); date < todayEnd; date.setDate(date.getDate() + 1)) {
      trendMap.set(date.toISOString().slice(0, 10), { dieselLitres: 0, petrolLitres: 0 });
    }

    for (const allocation of trendAllocationsRaw) {
      const key = allocation.issuedAt.toISOString().slice(0, 10);
      const entry = trendMap.get(key) ?? { dieselLitres: 0, petrolLitres: 0 };
      if (allocation.fuelType === "Diesel") {
        entry.dieselLitres += toNumber(allocation.litres);
      } else if (allocation.fuelType === "Petrol") {
        entry.petrolLitres += toNumber(allocation.litres);
      }
      trendMap.set(key, entry);
    }

    return NextResponse.json({
      summary: {
        dieselStockLitres,
        petrolStockLitres,
        monthDieselPurchasedLitres: fuelSum(monthPurchases, "Diesel"),
        monthPetrolPurchasedLitres: fuelSum(monthPurchases, "Petrol"),
        monthDieselAllocatedLitres: fuelSum(monthAllocations, "Diesel"),
        monthPetrolAllocatedLitres: fuelSum(monthAllocations, "Petrol"),
        todayDieselAllocatedLitres: fuelSum(todayAllocations, "Diesel"),
        todayPetrolAllocatedLitres: fuelSum(todayAllocations, "Petrol"),
        activeVehicles,
        openAnomalies: monthlyRows.filter((row) => row.anomaly).length
      },
      anomalies: monthlyRows.filter((row) => row.anomaly).slice(0, 8),
      recentAllocations: recentAllocations.map(serializeAllocation),
      recentPurchases: recentPurchases.map(serializePurchase),
      allocationTrend: Array.from(trendMap.entries()).map(([date, entry]) => ({
        date,
        dieselLitres: roundNumber(entry.dieselLitres),
        petrolLitres: roundNumber(entry.petrolLitres)
      }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}
