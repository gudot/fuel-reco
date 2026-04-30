import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const roleSchema = z.enum(["ADMIN", "ACCOUNTANT", "OPERATIONS"]);

export const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: roleSchema,
  password: z.string().min(8)
});

export const driverCreateSchema = z.object({
  name: z.string().min(2),
  employeeNumber: z.preprocess(emptyToUndefined, z.string().min(2).optional()),
  phone: z.preprocess(emptyToUndefined, z.string().min(3).optional()),
  licenseNumber: z.preprocess(emptyToUndefined, z.string().min(2).optional())
});

export const vehicleCreateSchema = z.object({
  registrationNumber: z.string().min(3).transform((value) => value.toUpperCase()),
  make: z.string().min(2),
  model: z.string().min(1),
  department: z.string().min(2),
  fuelType: z.string().min(2).default("Diesel"),
  tankCapacityLitres: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
  expectedKmPerLitre: z.coerce.number().positive(),
  anomalyTolerancePercent: z.coerce.number().min(1).max(100).default(15),
  currentOdometerKm: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
  driverId: z.preprocess(emptyToUndefined, z.string().optional())
});

export const fuelPurchaseCreateSchema = z.object({
  supplier: z.string().min(2),
  invoiceNumber: z.preprocess(emptyToUndefined, z.string().min(2).optional()),
  purchasedAt: z.coerce.date(),
  litres: z.coerce.number().positive(),
  unitCost: z.coerce.number().nonnegative(),
  notes: z.preprocess(emptyToUndefined, z.string().optional())
});

export const fuelAllocationCreateSchema = z.object({
  vehicleId: z.string().min(1),
  issuedAt: z.coerce.date(),
  litres: z.coerce.number().positive(),
  odometerKm: z.coerce.number().nonnegative(),
  voucherNumber: z.preprocess(emptyToUndefined, z.string().min(2).optional()),
  purpose: z.string().min(2),
  destination: z.preprocess(emptyToUndefined, z.string().optional())
});

export const mileageLogCreateSchema = z.object({
  vehicleId: z.string().min(1),
  recordedAt: z.coerce.date(),
  odometerKm: z.coerce.number().nonnegative(),
  distanceKm: z.coerce.number().positive(),
  notes: z.preprocess(emptyToUndefined, z.string().optional())
});

export const dailyReportQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const monthlyReportQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional()
});
