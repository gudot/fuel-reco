"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { apiFetch, formatDate, formatNumber, formToObject } from "@/lib/client-api";
import { DataTable } from "@/components/data-table";
import { useSessionUser } from "@/components/session-context";

type Vehicle = {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  currentOdometerKm: number | null;
};

type Allocation = {
  id: string;
  issuedAt: string;
  litres: number;
  odometerKm: number;
  voucherNumber: string | null;
  purpose: string;
  destination: string | null;
  remainingStockLitres: number;
  vehicle?: { registrationNumber: string };
  recordedBy?: { name: string; email: string };
};

type VehiclesResponse = { vehicles: Vehicle[] };
type AllocationsResponse = { allocations: Allocation[] };

const columns: ColumnDef<Allocation>[] = [
  { header: "Date", cell: ({ row }) => formatDate(row.original.issuedAt) },
  { header: "Vehicle", cell: ({ row }) => row.original.vehicle?.registrationNumber ?? "Unknown" },
  { header: "Voucher", cell: ({ row }) => row.original.voucherNumber ?? "N/A" },
  { header: "Litres", cell: ({ row }) => formatNumber(row.original.litres, " L") },
  { header: "Odometer", cell: ({ row }) => formatNumber(row.original.odometerKm, " km") },
  { header: "Purpose", accessorKey: "purpose" },
  { header: "Stock After", cell: ({ row }) => formatNumber(row.original.remainingStockLitres, " L") },
  { header: "Recorded By", cell: ({ row }) => row.original.recordedBy?.name ?? "Unknown" }
];

export function AllocationsClient() {
  const user = useSessionUser();
  const canIssueFuel = user.role === "ADMIN" || user.role === "ACCOUNTANT";
  const queryClient = useQueryClient();
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => apiFetch<VehiclesResponse>("/api/vehicles") });
  const allocations = useQuery({
    queryKey: ["allocations"],
    queryFn: () => apiFetch<AllocationsResponse>("/api/allocations")
  });

  const createAllocation = useMutation({
    mutationFn: (payload: Record<string, FormDataEntryValue>) =>
      apiFetch("/api/allocations", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  function submitAllocation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    createAllocation.mutate(formToObject(form), { onSuccess: () => form.reset() });
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="brand-kicker">Vehicle fuel Allocations</p>
          <h3>Fuel allocations</h3>
        </div>
      </header>

      <section className={canIssueFuel ? "grid two" : "grid"}>
        {canIssueFuel ? (
          <div className="panel">
            <h2>Allocate fuel</h2>
            <form onSubmit={submitAllocation}>
              <div className="form-grid">
                <div className="field">
                  <label>Vehicle</label>
                  <select name="vehicleId" required defaultValue="">
                    <option value="" disabled>
                      Select vehicle
                    </option>
                    {vehicles.data?.vehicles.map((vehicle) => (
                      <option value={vehicle.id} key={vehicle.id}>
                        {vehicle.registrationNumber} · {vehicle.make} {vehicle.model}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Issue date</label>
                  <input name="issuedAt" type="datetime-local" required />
                </div>
                <div className="field">
                  <label>Litres</label>
                  <input name="litres" type="number" min="0.01" step="0.01" required />
                </div>
                <div className="field">
                  <label>Odometer</label>
                  <input name="odometerKm" type="number" min="0" step="0.01" required />
                </div>
                <div className="field">
                  <label>Voucher number</label>
                  <input name="voucherNumber" />
                </div>
                <div className="field">
                  <label>Destination</label>
                  <input name="destination" />
                </div>
                <div className="field full">
                  <label>Purpose</label>
                  <textarea name="purpose" rows={3} required />
                </div>
              </div>
              {createAllocation.error ? <div className="error">{createAllocation.error.message}</div> : null}
              <div className="button-row">
                <button className="button" disabled={createAllocation.isPending} type="submit">
                  Issue fuel
                </button>
              </div>
            </form>
          </div>
        ) : null}
        <div className="panel">
          <h2>Allocation history</h2>
          <DataTable data={allocations.data?.allocations ?? []} columns={columns} />
        </div>
      </section>
    </>
  );
}
