"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { apiFetch, formatNumber } from "@/lib/client-api";
import type { ReconciliationRow } from "@/lib/types";
import { DataTable } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";

type DailyReport = {
  reportDate: string;
  summary: {
    openingDieselStockLitres: number;
    openingPetrolStockLitres: number;
    dieselPurchasedLitres: number;
    petrolPurchasedLitres: number;
    dieselAllocatedLitres: number;
    petrolAllocatedLitres: number;
    closingDieselStockLitres: number;
    closingPetrolStockLitres: number;
    dieselPurchaseCost: number;
    petrolPurchaseCost: number;
  };
  anomalies: ReconciliationRow[];
};

type MonthlyReport = {
  month: string;
  summary: {
    openingDieselStockLitres: number;
    openingPetrolStockLitres: number;
    dieselPurchasedLitres: number;
    petrolPurchasedLitres: number;
    dieselAllocatedLitres: number;
    petrolAllocatedLitres: number;
    closingDieselStockLitres: number;
    closingPetrolStockLitres: number;
    dieselPurchaseCost: number;
    petrolPurchaseCost: number;
    anomalyCount: number;
  };
  reconciliation: ReconciliationRow[];
};

const reconciliationColumns: ColumnDef<ReconciliationRow>[] = [
  { header: "Vehicle", accessorKey: "registrationNumber" },
  { header: "Fuel", cell: ({ row }) => <span className="badge ok">{row.original.fuelType}</span> },
  { header: "Driver", accessorKey: "driverName" },
  { header: "Expected", cell: ({ row }) => formatNumber(row.original.expectedKmPerLitre, " km/L") },
  { header: "Allocated", cell: ({ row }) => formatNumber(row.original.allocatedLitres, " L") },
  { header: "Distance", cell: ({ row }) => formatNumber(row.original.distanceKm, " km") },
  { header: "Actual", cell: ({ row }) => formatNumber(row.original.actualKmPerLitre, " km/L") },
  { header: "Variance", cell: ({ row }) => formatNumber(row.original.varianceLitres, " L") },
  {
    header: "Status",
    cell: ({ row }) => (
      <span className={`badge ${row.original.anomaly ? "alert" : "ok"}`}>
        {row.original.anomaly ? "Anomaly" : "Normal"}
      </span>
    )
  },
  { header: "Reason", accessorKey: "anomalyReason" }
];

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function monthValue() {
  return new Date().toISOString().slice(0, 7);
}

const ICONS = {
  droplet: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.74 5.88a6 6 0 0 1-8.48 8.48A6 6 0 0 1 5.26 11.3L12 2.69z" />
    </svg>
  ),
  cart: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  arrowOut: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17l9.2-9.2M17 17V7H7" />
    </svg>
  ),
  lock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  dollar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  alert: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
};

export function ReportsClient() {
  const [dailyDate, setDailyDate] = useState(todayValue());
  const [month, setMonth] = useState(monthValue());

  const daily = useQuery({
    queryKey: ["daily-report", dailyDate],
    queryFn: () => apiFetch<DailyReport>(`/api/reports/daily?date=${dailyDate}`)
  });

  const monthly = useQuery({
    queryKey: ["monthly-report", month],
    queryFn: () => apiFetch<MonthlyReport>(`/api/reports/monthly?month=${month}`)
  });

  return (
    <>
      <header className="page-header">
        <div>
          <p className="brand-kicker">Audit-ready reports</p>
          <h3>Reports</h3>
        </div>
      </header>

      <section className="grid two">
        <div className="panel">
          <h3>Daily fuel status</h3>
          <div className="form-grid">
            <div className="field">
              <label>Report date</label>
              <input value={dailyDate} onChange={(event) => setDailyDate(event.target.value)} type="date" />
            </div>
          </div>
          {daily.data ? (
            <>
              <div className="grid three" style={{ marginTop: "1rem" }}>
                <StatCard label="Diesel Opening" value={formatNumber(daily.data.summary.openingDieselStockLitres, " L")} accent="fuel" icon={ICONS.droplet} />
                <StatCard label="Petrol Opening" value={formatNumber(daily.data.summary.openingPetrolStockLitres, " L")} accent="info" icon={ICONS.droplet} />
                <StatCard label="Diesel Purchased" value={formatNumber(daily.data.summary.dieselPurchasedLitres, " L")} accent="fuel" icon={ICONS.cart} />
                <StatCard label="Petrol Purchased" value={formatNumber(daily.data.summary.petrolPurchasedLitres, " L")} accent="info" icon={ICONS.cart} />
                <StatCard label="Diesel Allocated" value={formatNumber(daily.data.summary.dieselAllocatedLitres, " L")} accent="fuel" icon={ICONS.arrowOut} />
                <StatCard label="Petrol Allocated" value={formatNumber(daily.data.summary.petrolAllocatedLitres, " L")} accent="info" icon={ICONS.arrowOut} />
              </div>
              <div className="button-row">
                <a className="button" href={`/api/reports/daily/export?date=${dailyDate}`}>
                  Export daily Excel
                </a>
              </div>
            </>
          ) : null}
          {daily.error ? <div className="error">{daily.error.message}</div> : null}
        </div>

        <div className="panel">
          <h3>Monthly reconciliation</h3>
          <div className="form-grid">
            <div className="field">
              <label>Month</label>
              <input value={month} onChange={(event) => setMonth(event.target.value)} type="month" />
            </div>
          </div>
          {monthly.data ? (
            <>
              <div className="grid three" style={{ marginTop: "1rem" }}>
                <StatCard label="Diesel Closing" value={formatNumber(monthly.data.summary.closingDieselStockLitres, " L")} accent="fuel" icon={ICONS.lock} />
                <StatCard label="Petrol Closing" value={formatNumber(monthly.data.summary.closingPetrolStockLitres, " L")} accent="info" icon={ICONS.lock} />
                <StatCard label="Diesel Cost" value={`$${formatNumber(monthly.data.summary.dieselPurchaseCost)}`} accent="fuel" icon={ICONS.dollar} />
                <StatCard label="Petrol Cost" value={`$${formatNumber(monthly.data.summary.petrolPurchaseCost)}`} accent="info" icon={ICONS.dollar} />
                <StatCard label="Diesel Allocated" value={formatNumber(monthly.data.summary.dieselAllocatedLitres, " L")} accent="fuel" icon={ICONS.arrowOut} />
                <StatCard label="Petrol Allocated" value={formatNumber(monthly.data.summary.petrolAllocatedLitres, " L")} accent="info" icon={ICONS.arrowOut} />
                <StatCard label="Anomalies" value={monthly.data.summary.anomalyCount} accent="alert" icon={ICONS.alert} />
              </div>
              <div className="button-row">
                <a className="button" href={`/api/reports/monthly/export?month=${month}`}>
                  Export monthly Excel
                </a>
              </div>
            </>
          ) : null}
          {monthly.error ? <div className="error">{monthly.error.message}</div> : null}
        </div>
      </section>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Monthly vehicle reconciliation</h3>
        <DataTable data={monthly.data?.reconciliation ?? []} columns={reconciliationColumns} />
      </section>
    </>
  );
}
