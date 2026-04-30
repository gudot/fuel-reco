import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireApiUser } from "@/lib/api";
import { monthlyReportQuerySchema } from "@/lib/validation";
import { endOfMonth, formatMonthLabel, parseMonthInput, startOfMonth } from "@/lib/dates";
import { getReconciliationRows, getStockBefore } from "@/lib/reconciliation";
import { roundNumber, toNumber } from "@/lib/number";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(["ADMIN", "ACCOUNTANT"]);
    const url = new URL(request.url);
    const query = monthlyReportQuerySchema.parse(Object.fromEntries(url.searchParams));
    const month = parseMonthInput(query.month);
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const label = formatMonthLabel(start);

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
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "First Pack Fuel Reconciliation";
    workbook.created = new Date();

    const summary = workbook.addWorksheet("Monthly Summary");
    summary.columns = [
      { header: "Metric", key: "metric", width: 34 },
      { header: "Value", key: "value", width: 18 }
    ];
    summary.addRows([
      { metric: "Month", value: label },
      { metric: "Opening stock (L)", value: openingStock },
      { metric: "Purchased (L)", value: roundNumber(purchasedLitres) },
      { metric: "Allocated (L)", value: roundNumber(allocatedLitres) },
      { metric: "Closing stock (L)", value: roundNumber(openingStock + purchasedLitres - allocatedLitres) },
      { metric: "Purchase cost", value: roundNumber(toNumber(purchasesAgg._sum.totalCost)) },
      { metric: "Anomalies", value: reconciliation.filter((row) => row.anomaly).length }
    ]);

    const reconciliationSheet = workbook.addWorksheet("Reconciliation");
    reconciliationSheet.columns = [
      { header: "Vehicle", key: "vehicle", width: 16 },
      { header: "Driver", key: "driver", width: 24 },
      { header: "Department", key: "department", width: 20 },
      { header: "Expected KM/L", key: "expectedKmPerLitre", width: 16 },
      { header: "Allocated L", key: "allocatedLitres", width: 14 },
      { header: "Distance KM", key: "distanceKm", width: 14 },
      { header: "Expected L", key: "expectedLitres", width: 14 },
      { header: "Actual KM/L", key: "actualKmPerLitre", width: 14 },
      { header: "Variance L", key: "varianceLitres", width: 14 },
      { header: "Variance %", key: "variancePercent", width: 14 },
      { header: "Anomaly", key: "anomaly", width: 12 },
      { header: "Reason", key: "reason", width: 48 }
    ];
    reconciliationSheet.addRows(
      reconciliation.map((row) => ({
        vehicle: row.registrationNumber,
        driver: row.driverName,
        department: row.department,
        expectedKmPerLitre: row.expectedKmPerLitre,
        allocatedLitres: row.allocatedLitres,
        distanceKm: row.distanceKm,
        expectedLitres: row.expectedLitres,
        actualKmPerLitre: row.actualKmPerLitre ?? "",
        varianceLitres: row.varianceLitres,
        variancePercent: row.variancePercent ?? "",
        anomaly: row.anomaly ? "Yes" : "No",
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
      entity: "MonthlyReport",
      metadata: { month: label }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="monthly-fuel-reconciliation-${label}.xlsx"`
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
