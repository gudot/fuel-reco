import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireApiUser } from "@/lib/api";
import { dailyReportQuerySchema } from "@/lib/validation";
import { endOfDay, formatDateLabel, parseDateInput, startOfDay } from "@/lib/dates";
import { getReconciliationRows, getStockBefore } from "@/lib/reconciliation";
import { roundNumber, toNumber } from "@/lib/number";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(["ADMIN", "ACCOUNTANT"]);
    const url = new URL(request.url);
    const query = dailyReportQuerySchema.parse(Object.fromEntries(url.searchParams));
    const date = parseDateInput(query.date);
    const start = startOfDay(date);
    const end = endOfDay(date);
    const label = formatDateLabel(start);

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
        include: { createdBy: true },
        orderBy: { purchasedAt: "asc" }
      }),
      prisma.fuelAllocation.findMany({
        where: { issuedAt: { gte: start, lt: end } },
        include: { vehicle: true, recordedBy: true },
        orderBy: { issuedAt: "asc" }
      }),
      getReconciliationRows(start, end)
    ]);

    const purchasedLitres = toNumber(purchasesAgg._sum.litres);
    const allocatedLitres = toNumber(allocationsAgg._sum.litres);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "First Pack Fuel Reconciliation";
    workbook.created = new Date();

    const summary = workbook.addWorksheet("Daily Summary");
    summary.columns = [
      { header: "Metric", key: "metric", width: 34 },
      { header: "Value", key: "value", width: 18 }
    ];
    summary.addRows([
      { metric: "Report date", value: label },
      { metric: "Opening stock (L)", value: openingStock },
      { metric: "Purchased (L)", value: roundNumber(purchasedLitres) },
      { metric: "Allocated (L)", value: roundNumber(allocatedLitres) },
      { metric: "Closing stock (L)", value: roundNumber(openingStock + purchasedLitres - allocatedLitres) },
      { metric: "Purchase cost", value: roundNumber(toNumber(purchasesAgg._sum.totalCost)) },
      { metric: "Anomalies", value: reconciliation.filter((row) => row.anomaly).length }
    ]);

    const purchaseSheet = workbook.addWorksheet("Purchases");
    purchaseSheet.columns = [
      { header: "Time", key: "time", width: 22 },
      { header: "Supplier", key: "supplier", width: 28 },
      { header: "Invoice", key: "invoice", width: 18 },
      { header: "Litres", key: "litres", width: 14 },
      { header: "Unit Cost", key: "unitCost", width: 14 },
      { header: "Total Cost", key: "totalCost", width: 14 },
      { header: "Recorded By", key: "recordedBy", width: 24 }
    ];
    purchaseSheet.addRows(
      purchases.map((purchase) => ({
        time: purchase.purchasedAt.toISOString(),
        supplier: purchase.supplier,
        invoice: purchase.invoiceNumber ?? "",
        litres: toNumber(purchase.litres),
        unitCost: toNumber(purchase.unitCost),
        totalCost: toNumber(purchase.totalCost),
        recordedBy: purchase.createdBy.name
      }))
    );

    const allocationSheet = workbook.addWorksheet("Allocations");
    allocationSheet.columns = [
      { header: "Time", key: "time", width: 22 },
      { header: "Vehicle", key: "vehicle", width: 16 },
      { header: "Litres", key: "litres", width: 14 },
      { header: "Odometer", key: "odometer", width: 14 },
      { header: "Purpose", key: "purpose", width: 26 },
      { header: "Destination", key: "destination", width: 24 },
      { header: "Remaining Stock", key: "remaining", width: 18 },
      { header: "Recorded By", key: "recordedBy", width: 24 }
    ];
    allocationSheet.addRows(
      allocations.map((allocation) => ({
        time: allocation.issuedAt.toISOString(),
        vehicle: allocation.vehicle.registrationNumber,
        litres: toNumber(allocation.litres),
        odometer: toNumber(allocation.odometerKm),
        purpose: allocation.purpose,
        destination: allocation.destination ?? "",
        remaining: toNumber(allocation.remainingStockLitres),
        recordedBy: allocation.recordedBy.name
      }))
    );

    const anomalySheet = workbook.addWorksheet("Anomalies");
    anomalySheet.columns = [
      { header: "Vehicle", key: "vehicle", width: 16 },
      { header: "Driver", key: "driver", width: 24 },
      { header: "Allocated L", key: "allocated", width: 14 },
      { header: "Distance KM", key: "distance", width: 14 },
      { header: "Actual KM/L", key: "actual", width: 14 },
      { header: "Reason", key: "reason", width: 48 }
    ];
    anomalySheet.addRows(
      reconciliation
        .filter((row) => row.anomaly)
        .map((row) => ({
          vehicle: row.registrationNumber,
          driver: row.driverName,
          allocated: row.allocatedLitres,
          distance: row.distanceKm,
          actual: row.actualKmPerLitre ?? "",
          reason: row.anomalyReason
        }))
    );

    for (const worksheet of workbook.worksheets) {
      worksheet.getRow(1).font = { bold: true };
      worksheet.views = [{ state: "frozen", ySplit: 1 }];
    }

    await writeAuditLog({
      userId: user.id,
      action: "EXPORT",
      entity: "DailyReport",
      metadata: { date: label }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="daily-fuel-status-${label}.xlsx"`
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
