import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const emptyToNull = (value: unknown) => (value === "" ? null : value);
const stringToBoolean = (value: unknown) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
};

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const roleSchema = z.enum(["ADMIN", "ACCOUNTANT", "OPERATIONS"]);
export const fuelTypeSchema = z.enum(["Diesel", "Petrol"]);

export const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: roleSchema,
  password: z.string().min(8)
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: roleSchema.optional(),
  active: z.preprocess(stringToBoolean, z.boolean().optional()),
  password: z.preprocess(emptyToUndefined, z.string().min(8).optional())
});

export const driverCreateSchema = z.object({
  name: z.string().min(2),
  employeeNumber: z.preprocess(emptyToUndefined, z.string().min(2).optional()),
  phone: z.preprocess(emptyToUndefined, z.string().min(3).optional()),
  licenseNumber: z.preprocess(emptyToUndefined, z.string().min(2).optional())
});

export const driverUpdateSchema = driverCreateSchema.partial().extend({
  active: z.preprocess(stringToBoolean, z.boolean().optional())
});

export const vehicleCreateSchema = z.object({
  registrationNumber: z.string().min(3).transform((value) => value.toUpperCase()),
  make: z.string().min(2),
  model: z.string().min(1),
  department: z.string().min(2),
  fuelType: fuelTypeSchema.default("Diesel"),
  tankCapacityLitres: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
  expectedKmPerLitre: z.coerce.number().positive(),
  anomalyTolerancePercent: z.coerce.number().min(1).max(100).default(15),
  currentOdometerKm: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
  driverId: z.preprocess(emptyToUndefined, z.string().optional())
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial().extend({
  driverId: z.preprocess(emptyToNull, z.string().nullable().optional()),
  active: z.preprocess(stringToBoolean, z.boolean().optional())
});

export const fuelPurchaseCreateSchema = z.object({
  supplier: z.string().min(2),
  invoiceNumber: z.preprocess(emptyToUndefined, z.string().min(2).optional()),
  fuelType: fuelTypeSchema.default("Diesel"),
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
