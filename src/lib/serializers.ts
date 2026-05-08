import type { Driver, FuelAllocation, FuelPurchase, MileageLog, User, Vehicle } from "@prisma/client";
import { toNumber } from "@/lib/number";

export function serializeUser(user: Pick<User, "id" | "name" | "email" | "role" | "active" | "createdAt">) {
  return {
    ...user,
    createdAt: user.createdAt.toISOString()
  };
}

export function serializeDriver(driver: Driver) {
  return {
    ...driver,
    createdAt: driver.createdAt.toISOString(),
    updatedAt: driver.updatedAt.toISOString()
  };
}

export function serializeVehicle(vehicle: Vehicle & { driver?: Driver | null }) {
  return {
    ...vehicle,
    tankCapacityLitres: vehicle.tankCapacityLitres === null ? null : toNumber(vehicle.tankCapacityLitres),
    expectedKmPerLitre: toNumber(vehicle.expectedKmPerLitre),
    anomalyTolerancePercent: toNumber(vehicle.anomalyTolerancePercent),
    currentOdometerKm: vehicle.currentOdometerKm === null ? null : toNumber(vehicle.currentOdometerKm),
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
    driver: vehicle.driver ? serializeDriver(vehicle.driver) : null
  };
}

export function serializePurchase(purchase: FuelPurchase & { createdBy?: Pick<User, "name" | "email"> }) {
  return {
    ...purchase,
    purchasedAt: purchase.purchasedAt.toISOString(),
    litres: toNumber(purchase.litres),
    unitCost: toNumber(purchase.unitCost),
    totalCost: toNumber(purchase.totalCost),
    createdAt: purchase.createdAt.toISOString(),
    updatedAt: purchase.updatedAt.toISOString()
  };
}

export function serializeAllocation(
  allocation: FuelAllocation & {
    vehicle?: Pick<Vehicle, "registrationNumber" | "fuelType">;
    recordedBy?: Pick<User, "name" | "email">;
  }
) {
  return {
    ...allocation,
    issuedAt: allocation.issuedAt.toISOString(),
    litres: toNumber(allocation.litres),
    odometerKm: toNumber(allocation.odometerKm),
    remainingStockLitres: toNumber(allocation.remainingStockLitres),
    createdAt: allocation.createdAt.toISOString(),
    updatedAt: allocation.updatedAt.toISOString()
  };
}

export function serializeMileageLog(
  mileageLog: MileageLog & {
    vehicle?: Pick<Vehicle, "registrationNumber">;
    recordedBy?: Pick<User, "name" | "email">;
  }
) {
  return {
    ...mileageLog,
    recordedAt: mileageLog.recordedAt.toISOString(),
    odometerKm: toNumber(mileageLog.odometerKm),
    distanceKm: toNumber(mileageLog.distanceKm),
    createdAt: mileageLog.createdAt.toISOString(),
    updatedAt: mileageLog.updatedAt.toISOString()
  };
}
