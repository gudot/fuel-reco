import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireApiUser } from "@/lib/api";
import { dailyReportQuerySchema } from "@/lib/validation";
import { endOfDay, formatDateLabel, parseDateInput, startOfDay } from "@/lib/dates";
import { getReconciliationRows, getStockBefore } from "@/lib/reconciliation";
import { roundNumber, toNumber } from "@/lib/number";
import { serializeAllocation, serializePurchase } from "@/lib/serializers";

export const dynamic = "force-dynamic";
const FUEL_TYPES = ["Diesel", "Petrol"] as const;

function fuelSum(rows: Array<{ fuelType: string; _sum: { litres?: unknown; totalCost?: unknown } }>, fuelType: string, field: "litres" | "totalCost") {
  return roundNumber(toNumber(rows.find((row) => row.fuelType === fuelType)?._sum[field]));
}

export async function GET(request: Request) {
  try {
    await requireApiUser();
    const url = new URL(request.url);
    const query = dailyReportQuerySchema.parse(Object.fromEntries(url.searchParams));
    const date = parseDateInput(query.date);
    const start = startOfDay(date);
    const end = endOfDay(date);

    const [openingDieselStock, openingPetrolStock, purchasesAgg, allocationsAgg, purchases, allocations, reconciliation] = await Promise.all([
      getStockBefore(start, "Diesel"),
      getStockBefore(start, "Petrol"),
      prisma.fuelPurchase.groupBy({
        by: ["fuelType"],
        where: { fuelType: { in: [...FUEL_TYPES] }, purchasedAt: { gte: start, lt: end } },
        _sum: { litres: true, totalCost: true }
      }),
      prisma.fuelAllocation.groupBy({
        by: ["fuelType"],
        where: { fuelType: { in: [...FUEL_TYPES] }, issuedAt: { gte: start, lt: end } },
        _sum: { litres: true }
      }),
      prisma.fuelPurchase.findMany({
        where: { purchasedAt: { gte: start, lt: end } },
        include: { createdBy: { select: { name: true, email: true } } },
        orderBy: { purchasedAt: "asc" }
      }),
      prisma.fuelAllocation.findMany({
        where: { issuedAt: { gte: start, lt: end } },
        include: {
          vehicle: { select: { registrationNumber: true, fuelType: true } },
          recordedBy: { select: { name: true, email: true } }
        },
        orderBy: { issuedAt: "asc" }
      }),
      getReconciliationRows(start, end)
    ]);

    const dieselPurchasedLitres = fuelSum(purchasesAgg, "Diesel", "litres");
    const petrolPurchasedLitres = fuelSum(purchasesAgg, "Petrol", "litres");
    const dieselAllocatedLitres = fuelSum(allocationsAgg, "Diesel", "litres");
    const petrolAllocatedLitres = fuelSum(allocationsAgg, "Petrol", "litres");

    return NextResponse.json({
      reportDate: formatDateLabel(start),
      summary: {
        openingDieselStockLitres: openingDieselStock,
        openingPetrolStockLitres: openingPetrolStock,
        dieselPurchasedLitres,
        petrolPurchasedLitres,
        dieselAllocatedLitres,
        petrolAllocatedLitres,
        closingDieselStockLitres: roundNumber(openingDieselStock + dieselPurchasedLitres - dieselAllocatedLitres),
        closingPetrolStockLitres: roundNumber(openingPetrolStock + petrolPurchasedLitres - petrolAllocatedLitres),
        dieselPurchaseCost: fuelSum(purchasesAgg, "Diesel", "totalCost"),
        petrolPurchaseCost: fuelSum(purchasesAgg, "Petrol", "totalCost")
      },
      purchases: purchases.map(serializePurchase),
      allocations: allocations.map(serializeAllocation),
      anomalies: reconciliation.filter((row) => row.anomaly)
    });
  } catch (error) {
    return handleApiError(error);
  }
}
