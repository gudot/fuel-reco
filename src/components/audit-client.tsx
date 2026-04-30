"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { apiFetch, formatDate } from "@/lib/client-api";
import { DataTable } from "@/components/data-table";

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  user: { name: string; email: string } | null;
};

type AuditResponse = { auditLogs: AuditLog[] };

const columns: ColumnDef<AuditLog>[] = [
  { header: "Date", cell: ({ row }) => formatDate(row.original.createdAt) },
  { header: "User", cell: ({ row }) => row.original.user?.name ?? "System" },
  { header: "Action", accessorKey: "action" },
  { header: "Entity", accessorKey: "entity" },
  { header: "Entity ID", cell: ({ row }) => row.original.entityId ?? "N/A" },
  {
    header: "Metadata",
    cell: ({ row }) => (
      <code>{row.original.metadata ? JSON.stringify(row.original.metadata).slice(0, 120) : "N/A"}</code>
    )
  }
];

export function AuditClient() {
  const audit = useQuery({ queryKey: ["audit"], queryFn: () => apiFetch<AuditResponse>("/api/audit") });

  return (
    <>
      <header className="page-header">
        <div>
          <p className="brand-kicker">Accountability</p>
          <h3>Audit trail</h3>
        </div>
      </header>

      <section className="panel">
        <h5>Recent system events</h5>
        {audit.error ? <div className="error">{audit.error.message}</div> : null}
        <DataTable data={audit.data?.auditLogs ?? []} columns={columns} />
      </section>
    </>
  );
}
