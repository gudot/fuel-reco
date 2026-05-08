import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireApiUser } from "@/lib/api";
import { monthlyReportQuerySchema } from "@/lib/validation";
import { endOfMonth, formatMonthLabel, parseMonthInput, startOfMonth } from "@/lib/dates";
import { getReconciliationRows, getStockBefore } from "@/lib/reconciliation";
import { roundNumber, toNumber } from "@/lib/number";

export const dynamic = "force-dynamic";
const FUEL_TYPES = ["Diesel", "Petrol"] as const;

function fuelSum(rows: Array<{ fuelType: string; _sum: { litres?: unknown; totalCost?: unknown } }>, fuelType: string, field: "litres" | "totalCost") {
  return roundNumber(toNumber(rows.find((row) => row.fuelType === fuelType)?._sum[field]));
}

export async function GET(request: Request) {
  try {
    await requireApiUser();
    const url = new URL(request.url);
    const query = monthlyReportQuerySchema.parse(Object.fromEntries(url.searchParams));
    const month = parseMonthInput(query.month);
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    const [openingDieselStock, openingPetrolStock, purchasesAgg, allocationsAgg, reconciliation] = await Promise.all([
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
      getReconciliationRows(start, end)
    ]);

    const dieselPurchasedLitres = fuelSum(purchasesAgg, "Diesel", "litres");
    const petrolPurchasedLitres = fuelSum(purchasesAgg, "Petrol", "litres");
    const dieselAllocatedLitres = fuelSum(allocationsAgg, "Diesel", "litres");
    const petrolAllocatedLitres = fuelSum(allocationsAgg, "Petrol", "litres");

    return NextResponse.json({
      month: formatMonthLabel(start),
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
        petrolPurchaseCost: fuelSum(purchasesAgg, "Petrol", "totalCost"),
        anomalyCount: reconciliation.filter((row) => row.anomaly).length
      },
      reconciliation
    });
  } catch (error) {
    return handleApiError(error);
  }
}
