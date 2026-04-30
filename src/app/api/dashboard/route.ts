import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireApiUser } from "@/lib/api";
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "@/lib/dates";
import { getCurrentStockLitres, getReconciliationRows } from "@/lib/reconciliation";
import { roundNumber, toNumber } from "@/lib/number";
import { serializeAllocation, serializePurchase } from "@/lib/serializers";

export const dynamic = "force-dynamic";

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
      currentStockLitres,
      monthPurchases,
      monthAllocations,
      todayAllocations,
      activeVehicles,
      monthlyRows,
      recentAllocations,
      recentPurchases,
      trendAllocations
    ] = await Promise.all([
      getCurrentStockLitres(),
      prisma.fuelPurchase.aggregate({
        where: { purchasedAt: { gte: monthStart, lt: monthEnd } },
        _sum: { litres: true }
      }),
      prisma.fuelAllocation.aggregate({
        where: { issuedAt: { gte: monthStart, lt: monthEnd } },
        _sum: { litres: true }
      }),
      prisma.fuelAllocation.aggregate({
        where: { issuedAt: { gte: todayStart, lt: todayEnd } },
        _sum: { litres: true }
      }),
      prisma.vehicle.count({ where: { active: true } }),
      getReconciliationRows(monthStart, monthEnd),
      prisma.fuelAllocation.findMany({
        include: {
          vehicle: { select: { registrationNumber: true } },
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
      prisma.fuelAllocation.groupBy({
        by: ["issuedAt"],
        where: { issuedAt: { gte: trendStart, lt: todayEnd } },
        _sum: { litres: true }
      })
    ]);

    return NextResponse.json({
      summary: {
        currentStockLitres,
        monthPurchasedLitres: roundNumber(toNumber(monthPurchases._sum.litres)),
        monthAllocatedLitres: roundNumber(toNumber(monthAllocations._sum.litres)),
        todayAllocatedLitres: roundNumber(toNumber(todayAllocations._sum.litres)),
        activeVehicles,
        openAnomalies: monthlyRows.filter((row) => row.anomaly).length
      },
      anomalies: monthlyRows.filter((row) => row.anomaly).slice(0, 8),
      recentAllocations: recentAllocations.map(serializeAllocation),
      recentPurchases: recentPurchases.map(serializePurchase),
      allocationTrend: trendAllocations.map((row) => ({
        date: row.issuedAt.toISOString().slice(0, 10),
        litres: roundNumber(toNumber(row._sum.litres))
      }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}
