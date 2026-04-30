import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireApiUser } from "@/lib/api";
import { monthlyReportQuerySchema } from "@/lib/validation";
import { endOfMonth, formatMonthLabel, parseMonthInput, startOfMonth } from "@/lib/dates";
import { getReconciliationRows, getStockBefore } from "@/lib/reconciliation";
import { roundNumber, toNumber } from "@/lib/number";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser();
    const url = new URL(request.url);
    const query = monthlyReportQuerySchema.parse(Object.fromEntries(url.searchParams));
    const month = parseMonthInput(query.month);
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    const [openingStock, purchasesAgg, allocationsAgg, reconciliation] = await Promise.all([
      getStockBefore(start),
      prisma.fuelPurchase.aggregate({
        where: { purchasedAt: { gte: start, lt: end } },
        _sum: { litres: true, totalCost: true }
      }),
      prisma.fuelAllocation.aggregate({
        where: { issuedAt: { gte: start, lt: end } },
        _sum: { litres: true }
      }),
      getReconciliationRows(start, end)
    ]);

    const purchasedLitres = toNumber(purchasesAgg._sum.litres);
    const allocatedLitres = toNumber(allocationsAgg._sum.litres);

    return NextResponse.json({
      month: formatMonthLabel(start),
      summary: {
        openingStockLitres: openingStock,
        purchasedLitres: roundNumber(purchasedLitres),
        allocatedLitres: roundNumber(allocatedLitres),
        closingStockLitres: roundNumber(openingStock + purchasedLitres - allocatedLitres),
        purchaseCost: roundNumber(toNumber(purchasesAgg._sum.totalCost)),
        anomalyCount: reconciliation.filter((row) => row.anomaly).length
      },
      reconciliation
    });
  } catch (error) {
    return handleApiError(error);
  }
}
