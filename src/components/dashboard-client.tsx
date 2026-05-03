"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { apiFetch, formatDate, formatNumber } from "@/lib/client-api";
import type { DashboardSummary, ReconciliationRow } from "@/lib/types";
import { DataTable } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";

type AllocationRecord = {
  id: string;
  issuedAt: string;
  litres: number;
  purpose: string;
  remainingStockLitres: number;
  vehicle?: { registrationNumber: string };
};

type PurchaseRecord = {
  id: string;
  purchasedAt: string;
  litres: number;
  supplier: string;
  totalCost: number;
};

type DashboardResponse = {
  summary: DashboardSummary;
  anomalies: ReconciliationRow[];
  recentAllocations: AllocationRecord[];
  recentPurchases: PurchaseRecord[];
  allocationTrend: Array<{ date: string; litres: number }>;
};

const anomalyColumns: ColumnDef<ReconciliationRow>[] = [
  { header: "Vehicle", accessorKey: "registrationNumber" },
  { header: "Driver", accessorKey: "driverName" },
  { header: "Allocated", cell: ({ row }) => formatNumber(row.original.allocatedLitres, " L") },
  { header: "Distance", cell: ({ row }) => formatNumber(row.original.distanceKm, " km") },
  { header: "Actual", cell: ({ row }) => formatNumber(row.original.actualKmPerLitre, " km/L") },
  { header: "Reason", accessorKey: "anomalyReason" }
];

const allocationColumns: ColumnDef<AllocationRecord>[] = [
  { header: "Date", cell: ({ row }) => formatDate(row.original.issuedAt) },
  { header: "Vehicle", cell: ({ row }) => row.original.vehicle?.registrationNumber ?? "Unknown" },
  { header: "Litres", cell: ({ row }) => formatNumber(row.original.litres, " L") },
  { header: "Purpose", accessorKey: "purpose" },
  { header: "Stock After", cell: ({ row }) => formatNumber(row.original.remainingStockLitres, " L") }
];

const purchaseColumns: ColumnDef<PurchaseRecord>[] = [
  { header: "Date", cell: ({ row }) => formatDate(row.original.purchasedAt) },
  { header: "Supplier", accessorKey: "supplier" },
  { header: "Litres", cell: ({ row }) => formatNumber(row.original.litres, " L") },
  { header: "Cost", cell: ({ row }) => `$${formatNumber(row.original.totalCost)}` }
];

function buildTrendLine(points: Array<{ date: string; litres: number }>, maxTrend: number) {
  const width = 640;
  const height = 160;
  const paddingX = 20;
  const paddingY = 18;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;
  const divisor = Math.max(points.length - 1, 1);
  const coordinates = points.map((point, index) => {
    const x = paddingX + (index / divisor) * plotWidth;
    const y = paddingY + plotHeight - (point.litres / maxTrend) * plotHeight;

    return { ...point, x, y };
  });

  if (coordinates.length === 1) {
    const point = coordinates[0];
    const path = `M ${paddingX} ${point.y} L ${width - paddingX} ${point.y}`;

    return { coordinates, path, areaPath: `${path} L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`, width, height };
  }

  const path = coordinates
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }

      const previous = coordinates[index - 1];
      const controlOffset = (point.x - previous.x) / 2;

      return `C ${previous.x + controlOffset} ${previous.y}, ${point.x - controlOffset} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(" ");
  const areaPath = `${path} L ${coordinates[coordinates.length - 1].x} ${height - paddingY} L ${coordinates[0].x} ${height - paddingY} Z`;

  return { coordinates, path, areaPath, width, height };
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
  calendar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  truck: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  alert: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
};

export function DashboardClient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardResponse>("/api/dashboard")
  });

  if (isLoading) {
    return <div className="panel loading-text">Loading dashboard…</div>;
  }

  if (error || !data) {
    return <div className="error">{error instanceof Error ? error.message : "Unable to load dashboard."}</div>;
  }

  const maxTrend = Math.max(...data.allocationTrend.map((point) => point.litres), 1);
  const trendLine = data.allocationTrend.length ? buildTrendLine(data.allocationTrend, maxTrend) : null;

  return (
    <>
      <header className="page-header">
        <div>
          <p className="brand-kicker">Overview</p>
          <h3>Dashboard</h3>
        </div>
      </header>

      <section className="grid cards">
        <StatCard label="Current Stock" value={formatNumber(data.summary.currentStockLitres, " L")} accent="brand" icon={ICONS.droplet} />
        <StatCard label="Month Purchased" value={formatNumber(data.summary.monthPurchasedLitres, " L")} accent="fuel" icon={ICONS.cart} />
        <StatCard label="Month Allocated" value={formatNumber(data.summary.monthAllocatedLitres, " L")} accent="info" icon={ICONS.arrowOut} />
        <StatCard label="Today Allocated" value={formatNumber(data.summary.todayAllocatedLitres, " L")} accent="violet" icon={ICONS.calendar} />
        <StatCard label="Active Vehicles" value={data.summary.activeVehicles} accent="ok" icon={ICONS.truck} />
        <StatCard label="Open Anomalies" value={data.summary.openAnomalies} accent="alert" icon={ICONS.alert} />
      </section>

      <section className="grid two" style={{ marginTop: "1rem" }}>
        <div className="panel">
          <h5>30-day allocation trend</h5>
          <div className="trend" aria-label="Fuel allocation trend">
            {trendLine ? (
              <svg className="trend-line-chart" viewBox={`0 0 ${trendLine.width} ${trendLine.height}`} role="img">
                <defs>
                  <linearGradient id="allocationTrendFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f3b43f" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#0d5c4d" stopOpacity="0.04" />
                  </linearGradient>
                </defs>
                <path className="trend-area" d={trendLine.areaPath} />
                <path className="trend-line" d={trendLine.path} />
                {trendLine.coordinates.map((point) => (
                  <circle className="trend-point" cx={point.x} cy={point.y} key={`${point.date}-${point.litres}`} r="4">
                    <title>{`${point.date}: ${point.litres} L`}</title>
                  </circle>
                ))}
              </svg>
            ) : (
              <p>No allocations recorded in the last 30 days.</p>
            )}
          </div>
        </div>
        <div className="panel">
          <h5>Current anomaly watch</h5>
          <DataTable data={data.anomalies} columns={anomalyColumns} empty="No anomalies detected for the month." />
        </div>
      </section>

      <section className="grid two" style={{ marginTop: "1rem" }}>
        <div className="panel">
          <h5>Recent allocations</h5>
          <DataTable data={data.recentAllocations} columns={allocationColumns} />
        </div>
        <div className="panel">
          <h5>Recent purchases</h5>
          <DataTable data={data.recentPurchases} columns={purchaseColumns} />
        </div>
      </section>
    </>
  );
}
