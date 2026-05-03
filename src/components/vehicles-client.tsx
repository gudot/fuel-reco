"use client";

import { useState } from "react";
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
  driverId: string | null;
  driver: Driver | null;
};

type VehiclesResponse = { vehicles: Vehicle[] };
type DriversResponse = { drivers: Driver[] };

export function VehiclesClient() {
  const user = useSessionUser();
  const canManage = user.role === "ADMIN";
  const queryClient = useQueryClient();
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => apiFetch<VehiclesResponse>("/api/vehicles") });
  const drivers = useQuery({ queryKey: ["drivers"], queryFn: () => apiFetch<DriversResponse>("/api/drivers") });

  const refreshDrivers = () => queryClient.invalidateQueries({ queryKey: ["drivers"] });
  const refreshVehicles = () => {
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createDriver = useMutation({
    mutationFn: (payload: Record<string, FormDataEntryValue>) =>
      apiFetch("/api/drivers", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: refreshDrivers
  });

  const updateDriver = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, FormDataEntryValue> }) =>
      apiFetch(`/api/drivers?id=${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: () => {
      setEditingDriver(null);
      refreshDrivers();
      refreshVehicles();
    }
  });

  const deleteDriver = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/drivers?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      refreshDrivers();
      refreshVehicles();
    }
  });

  const createVehicle = useMutation({
    mutationFn: (payload: Record<string, FormDataEntryValue>) =>
      apiFetch("/api/vehicles", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: refreshVehicles
  });

  const updateVehicle = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, FormDataEntryValue> }) =>
      apiFetch(`/api/vehicles?id=${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: () => {
      setEditingVehicle(null);
      refreshVehicles();
    }
  });

  const deleteVehicle = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/vehicles?id=${id}`, { method: "DELETE" }),
    onSuccess: refreshVehicles
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

  function submitDriverUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingDriver) {
      updateDriver.mutate({ id: editingDriver.id, payload: formToObject(event.currentTarget) });
    }
  }

  function submitVehicleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingVehicle) {
      updateVehicle.mutate({ id: editingVehicle.id, payload: formToObject(event.currentTarget) });
    }
  }

  const vehicleColumns: ColumnDef<Vehicle>[] = [
    { header: "Registration", accessorKey: "registrationNumber" },
    { header: "Vehicle", cell: ({ row }) => `${row.original.make} ${row.original.model}` },
    { header: "Department", accessorKey: "department" },
    { header: "Driver", cell: ({ row }) => row.original.driver?.name ?? "Unassigned" },
    { header: "Expected", cell: ({ row }) => formatNumber(row.original.expectedKmPerLitre, " km/L") },
    { header: "Tolerance", cell: ({ row }) => formatNumber(row.original.anomalyTolerancePercent, "%") },
    { header: "Odometer", cell: ({ row }) => formatNumber(row.original.currentOdometerKm, " km") },
    { header: "Status", cell: ({ row }) => <span className={`badge ${row.original.active ? "ok" : "alert"}`}>{row.original.active ? "Active" : "Inactive"}</span> },
    {
      header: "Actions",
      cell: ({ row }) =>
        canManage ? (
          <div className="table-actions">
            <button className="mini-button" type="button" onClick={() => setEditingVehicle(row.original)}>
              Edit
            </button>
            <button
              className="mini-button danger"
              disabled={!row.original.active || deleteVehicle.isPending}
              type="button"
              onClick={() => {
                if (confirm(`Deactivate ${row.original.registrationNumber}?`)) {
                  deleteVehicle.mutate(row.original.id);
                }
              }}
            >
              Delete
            </button>
          </div>
        ) : null
    }
  ];

  const driverColumns: ColumnDef<Driver>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Employee #", cell: ({ row }) => row.original.employeeNumber ?? "N/A" },
    { header: "Phone", cell: ({ row }) => row.original.phone ?? "N/A" },
    { header: "License", cell: ({ row }) => row.original.licenseNumber ?? "N/A" },
    { header: "Status", cell: ({ row }) => <span className={`badge ${row.original.active ? "ok" : "alert"}`}>{row.original.active ? "Active" : "Inactive"}</span> },
    {
      header: "Actions",
      cell: ({ row }) =>
        canManage ? (
          <div className="table-actions">
            <button className="mini-button" type="button" onClick={() => setEditingDriver(row.original)}>
              Edit
            </button>
            <button
              className="mini-button danger"
              disabled={!row.original.active || deleteDriver.isPending}
              type="button"
              onClick={() => {
                if (confirm(`Deactivate ${row.original.name}?`)) {
                  deleteDriver.mutate(row.original.id);
                }
              }}
            >
              Delete
            </button>
          </div>
        ) : null
    }
  ];

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

      {canManage && (editingDriver || editingVehicle) ? (
        <section className="grid two" style={{ marginTop: "1rem" }}>
          {editingDriver ? (
            <div className="panel">
              <h2>Update driver</h2>
              <form onSubmit={submitDriverUpdate}>
                <div className="form-grid">
                  <div className="field">
                    <label>Name</label>
                    <input name="name" defaultValue={editingDriver.name} required />
                  </div>
                  <div className="field">
                    <label>Employee number</label>
                    <input name="employeeNumber" defaultValue={editingDriver.employeeNumber ?? ""} />
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input name="phone" defaultValue={editingDriver.phone ?? ""} />
                  </div>
                  <div className="field">
                    <label>License number</label>
                    <input name="licenseNumber" defaultValue={editingDriver.licenseNumber ?? ""} />
                  </div>
                  <div className="field">
                    <label>Status</label>
                    <select name="active" defaultValue={String(editingDriver.active)}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
                {updateDriver.error ? <div className="error">{updateDriver.error.message}</div> : null}
                <div className="button-row">
                  <button className="button" disabled={updateDriver.isPending} type="submit">
                    Save driver
                  </button>
                  <button className="button secondary" type="button" onClick={() => setEditingDriver(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : <div />}

          {editingVehicle ? (
            <div className="panel">
              <h2>Update vehicle</h2>
              <form onSubmit={submitVehicleUpdate}>
                <div className="form-grid">
                  <div className="field">
                    <label>Registration</label>
                    <input name="registrationNumber" defaultValue={editingVehicle.registrationNumber} required />
                  </div>
                  <div className="field">
                    <label>Driver</label>
                    <select name="driverId" defaultValue={editingVehicle.driverId ?? ""}>
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
                    <input name="make" defaultValue={editingVehicle.make} required />
                  </div>
                  <div className="field">
                    <label>Model</label>
                    <input name="model" defaultValue={editingVehicle.model} required />
                  </div>
                  <div className="field">
                    <label>Department</label>
                    <input name="department" defaultValue={editingVehicle.department} required />
                  </div>
                  <div className="field">
                    <label>Fuel type</label>
                    <input name="fuelType" defaultValue={editingVehicle.fuelType} required />
                  </div>
                  <div className="field">
                    <label>Tank capacity (L)</label>
                    <input name="tankCapacityLitres" type="number" min="0" step="0.01" defaultValue={editingVehicle.tankCapacityLitres ?? ""} />
                  </div>
                  <div className="field">
                    <label>Expected km/L</label>
                    <input name="expectedKmPerLitre" type="number" min="0.01" step="0.01" defaultValue={editingVehicle.expectedKmPerLitre} required />
                  </div>
                  <div className="field">
                    <label>Anomaly tolerance %</label>
                    <input name="anomalyTolerancePercent" type="number" min="1" max="100" step="0.01" defaultValue={editingVehicle.anomalyTolerancePercent} />
                  </div>
                  <div className="field">
                    <label>Current odometer</label>
                    <input name="currentOdometerKm" type="number" min="0" step="0.01" defaultValue={editingVehicle.currentOdometerKm ?? ""} />
                  </div>
                  <div className="field">
                    <label>Status</label>
                    <select name="active" defaultValue={String(editingVehicle.active)}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
                {updateVehicle.error ? <div className="error">{updateVehicle.error.message}</div> : null}
                <div className="button-row">
                  <button className="button" disabled={updateVehicle.isPending} type="submit">
                    Save vehicle
                  </button>
                  <button className="button secondary" type="button" onClick={() => setEditingVehicle(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : <div />}
        </section>
      ) : null}

      <section className="grid two" style={{ marginTop: "1rem" }}>
        <div className="panel">
          <h2>Vehicle register</h2>
          <DataTable data={vehicles.data?.vehicles ?? []} columns={vehicleColumns} />
          {deleteVehicle.error ? <div className="error">{deleteVehicle.error.message}</div> : null}
        </div>
        <div className="panel">
          <h2>Driver register</h2>
          <DataTable data={drivers.data?.drivers ?? []} columns={driverColumns} />
          {deleteDriver.error ? <div className="error">{deleteDriver.error.message}</div> : null}
        </div>
      </section>
    </>
  );
}
