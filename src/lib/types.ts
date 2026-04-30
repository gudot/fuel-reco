export type RoleName = "ADMIN" | "ACCOUNTANT" | "OPERATIONS";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: RoleName;
};

export type ApiErrorResponse = {
  error: string;
  details?: unknown;
};

export type SelectOption = {
  id: string;
  label: string;
};

export type DashboardSummary = {
  currentStockLitres: number;
  monthPurchasedLitres: number;
  monthAllocatedLitres: number;
  todayAllocatedLitres: number;
  activeVehicles: number;
  openAnomalies: number;
};

export type ReconciliationRow = {
  vehicleId: string;
  registrationNumber: string;
  driverName: string;
  department: string;
  expectedKmPerLitre: number;
  tolerancePercent: number;
  allocatedLitres: number;
  distanceKm: number;
  expectedLitres: number;
  actualKmPerLitre: number | null;
  varianceLitres: number;
  variancePercent: number | null;
  anomaly: boolean;
  anomalyReason: string;
};
