import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireApiUser } from "@/lib/api";
import { dailyReportQuerySchema } from "@/lib/validation";
import { endOfDay, formatDateLabel, parseDateInput, startOfDay } from "@/lib/dates";
import { getReconciliationRows, getStockBefore } from "@/lib/reconciliation";
import { roundNumber, toNumber } from "@/lib/number";
import { serializeAllocation, serializePurchase } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser();
    const url = new URL(request.url);
    const query = dailyReportQuerySchema.parse(Object.fromEntries(url.searchParams));
    const date = parseDateInput(query.date);
    const start = startOfDay(date);
    const end = endOfDay(date);

    const [openingStock, purchasesAgg, allocationsAgg, purchases, allocations, reconciliation] = await Promise.all([
      getStockBefore(start),
      prisma.fuelPurchase.aggregate({
        where: { purchasedAt: { gte: start, lt: end } },
        _sum: { litres: true, totalCost: true }
      }),
      prisma.fuelAllocation.aggregate({
        where: { issuedAt: { gte: start, lt: end } },
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
          vehicle: { select: { registrationNumber: true } },
          recordedBy: { select: { name: true, email: true } }
        },
        orderBy: { issuedAt: "asc" }
      }),
      getReconciliationRows(start, end)
    ]);

    const purchasedLitres = toNumber(purchasesAgg._sum.litres);
    const allocatedLitres = toNumber(allocationsAgg._sum.litres);
    const closingStock = roundNumber(openingStock + purchasedLitres - allocatedLitres);

    return NextResponse.json({
      reportDate: formatDateLabel(start),
      summary: {
        openingStockLitres: openingStock,
        purchasedLitres: roundNumber(purchasedLitres),
        allocatedLitres: roundNumber(allocatedLitres),
        closingStockLitres: closingStock,
        purchaseCost: roundNumber(toNumber(purchasesAgg._sum.totalCost))
      },
      purchases: purchases.map(serializePurchase),
      allocations: allocations.map(serializeAllocation),
      anomalies: reconciliation.filter((row) => row.anomaly)
    });
  } catch (error) {
    return handleApiError(error);
  }
}
