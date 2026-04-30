"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { apiFetch, formatDate, formatNumber, formToObject } from "@/lib/client-api";
import { DataTable } from "@/components/data-table";

type Purchase = {
  id: string;
  supplier: string;
  invoiceNumber: string | null;
  purchasedAt: string;
  litres: number;
  unitCost: number;
  totalCost: number;
  notes: string | null;
  createdBy?: { name: string; email: string };
};

type PurchasesResponse = { purchases: Purchase[] };

const columns: ColumnDef<Purchase>[] = [
  { header: "Date", cell: ({ row }) => formatDate(row.original.purchasedAt) },
  { header: "Supplier", accessorKey: "supplier" },
  { header: "Invoice", cell: ({ row }) => row.original.invoiceNumber ?? "N/A" },
  { header: "Litres", cell: ({ row }) => formatNumber(row.original.litres, " L") },
  { header: "Unit Cost", cell: ({ row }) => `$${formatNumber(row.original.unitCost)}` },
  { header: "Total", cell: ({ row }) => `$${formatNumber(row.original.totalCost)}` },
  { header: "Recorded By", cell: ({ row }) => row.original.createdBy?.name ?? "Unknown" }
];

export function PurchasesClient() {
  const queryClient = useQueryClient();
  const purchases = useQuery({ queryKey: ["purchases"], queryFn: () => apiFetch<PurchasesResponse>("/api/purchases") });

  const createPurchase = useMutation({
    mutationFn: (payload: Record<string, FormDataEntryValue>) =>
      apiFetch("/api/purchases", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  function submitPurchase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    createPurchase.mutate(formToObject(form), { onSuccess: () => form.reset() });
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="brand-kicker">Company fuel input</p>
          <h3>Fuel purchases</h3>
        </div>
      </header>

      <section className="grid two">
        <div className="panel">
          <h2>Record purchase</h2>
          <form onSubmit={submitPurchase}>
            <div className="form-grid">
              <div className="field">
                <label>Supplier</label>
                <input name="supplier" required />
              </div>
              <div className="field">
                <label>Invoice number</label>
                <input name="invoiceNumber" />
              </div>
              <div className="field">
                <label>Purchase date</label>
                <input name="purchasedAt" type="datetime-local" required />
              </div>
              <div className="field">
                <label>Litres</label>
                <input name="litres" type="number" min="0.01" step="0.01" required />
              </div>
              <div className="field">
                <label>Unit cost</label>
                <input name="unitCost" type="number" min="0" step="0.01" required />
              </div>
              <div className="field full">
                <label>Notes</label>
                <textarea name="notes" rows={3} />
              </div>
            </div>
            {createPurchase.error ? <div className="error">{createPurchase.error.message}</div> : null}
            <div className="button-row">
              <button className="button" disabled={createPurchase.isPending} type="submit">
                Save purchase
              </button>
            </div>
          </form>
        </div>
        <div className="panel">
          <h2>Purchase history</h2>
          <DataTable data={purchases.data?.purchases ?? []} columns={columns} />
        </div>
      </section>
    </>
  );
}
