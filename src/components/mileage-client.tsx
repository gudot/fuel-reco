"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { apiFetch, formatDate, formatNumber, formToObject } from "@/lib/client-api";
import { DataTable } from "@/components/data-table";

type Vehicle = {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
};

type MileageLog = {
  id: string;
  recordedAt: string;
  odometerKm: number;
  distanceKm: number;
  notes: string | null;
  vehicle?: { registrationNumber: string };
  recordedBy?: { name: string; email: string };
};

type VehiclesResponse = { vehicles: Vehicle[] };
type MileageResponse = { mileageLogs: MileageLog[] };

const columns: ColumnDef<MileageLog>[] = [
  { header: "Date", cell: ({ row }) => formatDate(row.original.recordedAt) },
  { header: "Vehicle", cell: ({ row }) => row.original.vehicle?.registrationNumber ?? "Unknown" },
  { header: "Distance", cell: ({ row }) => formatNumber(row.original.distanceKm, " km") },
  { header: "Odometer", cell: ({ row }) => formatNumber(row.original.odometerKm, " km") },
  { header: "Notes", cell: ({ row }) => row.original.notes ?? "N/A" },
  { header: "Recorded By", cell: ({ row }) => row.original.recordedBy?.name ?? "Unknown" }
];

export function MileageClient() {
  const queryClient = useQueryClient();
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => apiFetch<VehiclesResponse>("/api/vehicles") });
  const mileage = useQuery({ queryKey: ["mileage"], queryFn: () => apiFetch<MileageResponse>("/api/mileage") });

  const createMileage = useMutation({
    mutationFn: (payload: Record<string, FormDataEntryValue>) =>
      apiFetch("/api/mileage", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mileage"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  function submitMileage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    createMileage.mutate(formToObject(form), { onSuccess: () => form.reset() });
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="brand-kicker">Distance evidence</p>
          <h3>Mileage logs</h3>
          </div>
        </header>

      <section className="grid two">
        <div className="panel">
          <h5>Record mileage</h5>
          <form onSubmit={submitMileage}>
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
                <label>Recorded at</label>
                <input name="recordedAt" type="datetime-local" required />
              </div>
              <div className="field">
                <label>Distance covered (km)</label>
                <input name="distanceKm" type="number" min="0.01" step="0.01" required />
              </div>
              <div className="field">
                <label>Odometer</label>
                <input name="odometerKm" type="number" min="0" step="0.01" required />
              </div>
              <div className="field full">
                <label>Notes</label>
                <textarea name="notes" rows={3} />
              </div>
            </div>
            {createMileage.error ? <div className="error">{createMileage.error.message}</div> : null}
            <div className="button-row">
              <button className="button" disabled={createMileage.isPending} type="submit">
                Save mileage
              </button>
            </div>
          </form>
        </div>
        <div className="panel">
          <h5>Mileage history</h5>
          <DataTable data={mileage.data?.mileageLogs ?? []} columns={columns} />
        </div>
      </section>
    </>
  );
}
