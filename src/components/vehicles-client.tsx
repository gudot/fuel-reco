"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { apiFetch, formatNumber, formToObject } from "@/lib/client-api";
import { DataTable } from "@/components/data-table";
import { useSessionUser } from "@/components/session-context";

type Driver = {
  id: string;
  name: string;
  employeeNumber: string | null;
  phone: string | null;
  licenseNumber: string | null;
  active: boolean;
};

type Vehicle = {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  department: string;
  fuelType: string;
  tankCapacityLitres: number | null;
  expectedKmPerLitre: number;
  anomalyTolerancePercent: number;
  currentOdometerKm: number | null;
  active: boolean;
  driver: Driver | null;
};

type VehiclesResponse = { vehicles: Vehicle[] };
type DriversResponse = { drivers: Driver[] };

const vehicleColumns: ColumnDef<Vehicle>[] = [
  { header: "Registration", accessorKey: "registrationNumber" },
  { header: "Vehicle", cell: ({ row }) => `${row.original.make} ${row.original.model}` },
  { header: "Department", accessorKey: "department" },
  { header: "Driver", cell: ({ row }) => row.original.driver?.name ?? "Unassigned" },
  { header: "Expected", cell: ({ row }) => formatNumber(row.original.expectedKmPerLitre, " km/L") },
  { header: "Tolerance", cell: ({ row }) => formatNumber(row.original.anomalyTolerancePercent, "%") },
  { header: "Odometer", cell: ({ row }) => formatNumber(row.original.currentOdometerKm, " km") }
];

const driverColumns: ColumnDef<Driver>[] = [
  { header: "Name", accessorKey: "name" },
  { header: "Employee #", cell: ({ row }) => row.original.employeeNumber ?? "N/A" },
  { header: "Phone", cell: ({ row }) => row.original.phone ?? "N/A" },
  { header: "License", cell: ({ row }) => row.original.licenseNumber ?? "N/A" },
  { header: "Status", cell: ({ row }) => <span className={`badge ${row.original.active ? "ok" : "alert"}`}>{row.original.active ? "Active" : "Inactive"}</span> }
];

export function VehiclesClient() {
  const user = useSessionUser();
  const canManage = user.role === "ADMIN";
  const queryClient = useQueryClient();
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => apiFetch<VehiclesResponse>("/api/vehicles") });
  const drivers = useQuery({ queryKey: ["drivers"], queryFn: () => apiFetch<DriversResponse>("/api/drivers") });

  const createDriver = useMutation({
    mutationFn: (payload: Record<string, FormDataEntryValue>) =>
      apiFetch("/api/drivers", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drivers"] })
  });

  const createVehicle = useMutation({
    mutationFn: (payload: Record<string, FormDataEntryValue>) =>
      apiFetch("/api/vehicles", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  function submitDriver(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    createDriver.mutate(formToObject(form), { onSuccess: () => form.reset() });
  }

  function submitVehicle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    createVehicle.mutate(formToObject(form), { onSuccess: () => form.reset() });
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="brand-kicker">Fleet register</p>
          <h3>Vehicles & drivers</h3>
        </div>
      </header>

      {canManage ? (
        <section className="grid two">
          <div className="panel">
            <h2>Add driver</h2>
            <form onSubmit={submitDriver}>
              <div className="form-grid">
                <div className="field">
                  <label>Name</label>
                  <input name="name" required />
                </div>
                <div className="field">
                  <label>Employee number</label>
                  <input name="employeeNumber" />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input name="phone" />
                </div>
                <div className="field">
                  <label>License number</label>
                  <input name="licenseNumber" />
                </div>
              </div>
              {createDriver.error ? <div className="error">{createDriver.error.message}</div> : null}
              <div className="button-row">
                <button className="button" disabled={createDriver.isPending} type="submit">
                  Add driver
                </button>
              </div>
            </form>
          </div>

          <div className="panel">
            <h2>Add vehicle</h2>
            <form onSubmit={submitVehicle}>
              <div className="form-grid">
                <div className="field">
                  <label>Registration</label>
                  <input name="registrationNumber" required />
                </div>
                <div className="field">
                  <label>Driver</label>
                  <select name="driverId" defaultValue="">
                    <option value="">Unassigned</option>
                    {drivers.data?.drivers.map((driver) => (
                      <option value={driver.id} key={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Make</label>
                  <input name="make" required />
                </div>
                <div className="field">
                  <label>Model</label>
                  <input name="model" required />
                </div>
                <div className="field">
                  <label>Department</label>
                  <input name="department" required />
                </div>
                <div className="field">
                  <label>Fuel type</label>
                  <input name="fuelType" defaultValue="Diesel" required />
                </div>
                <div className="field">
                  <label>Tank capacity (L)</label>
                  <input name="tankCapacityLitres" type="number" min="0" step="0.01" />
                </div>
                <div className="field">
                  <label>Expected km/L</label>
                  <input name="expectedKmPerLitre" type="number" min="0.01" step="0.01" required />
                </div>
                <div className="field">
                  <label>Anomaly tolerance %</label>
                  <input name="anomalyTolerancePercent" type="number" min="1" max="100" step="0.01" defaultValue="15" />
                </div>
                <div className="field">
                  <label>Current odometer</label>
                  <input name="currentOdometerKm" type="number" min="0" step="0.01" />
                </div>
              </div>
              {createVehicle.error ? <div className="error">{createVehicle.error.message}</div> : null}
              <div className="button-row">
                <button className="button" disabled={createVehicle.isPending} type="submit">
                  Add vehicle
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      <section className="grid two" style={{ marginTop: "1rem" }}>
        <div className="panel">
          <h2>Vehicle register</h2>
          <DataTable data={vehicles.data?.vehicles ?? []} columns={vehicleColumns} />
        </div>
        <div className="panel">
          <h2>Driver register</h2>
          <DataTable data={drivers.data?.drivers ?? []} columns={driverColumns} />
        </div>
      </section>
    </>
  );
}
