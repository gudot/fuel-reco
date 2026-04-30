import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertUser(name: string, email: string, role: Role, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash, active: true },
    create: { name, email, role, passwordHash }
  });
}

async function main() {
  const admin = await upsertUser("System Administrator", "admin@firstpack.co.zw", "ADMIN", "FuelAdmin123!");
  const accountant = await upsertUser("Fuel Accountant", "accountant@firstpack.co.zw", "ACCOUNTANT", "FuelAccount123!");
  const operator = await upsertUser("Operations Officer", "operations@firstpack.co.zw", "OPERATIONS", "FuelOps123!");

  const driverOne = await prisma.driver.upsert({
    where: { employeeNumber: "DRV-001" },
    update: {},
    create: {
      employeeNumber: "DRV-001",
      name: "Tawanda Moyo",
      phone: "+263 77 000 1001",
      licenseNumber: "DL-29301"
    }
  });

  const driverTwo = await prisma.driver.upsert({
    where: { employeeNumber: "DRV-002" },
    update: {},
    create: {
      employeeNumber: "DRV-002",
      name: "Nyasha Dube",
      phone: "+263 77 000 1002",
      licenseNumber: "DL-29302"
    }
  });

  const vehicleOne = await prisma.vehicle.upsert({
    where: { registrationNumber: "AFQ 1123" },
    update: {},
    create: {
      registrationNumber: "AFQ 1123",
      make: "Toyota",
      model: "Hilux",
      department: "Operations",
      fuelType: "Diesel",
      tankCapacityLitres: 80,
      expectedKmPerLitre: 9.5,
      anomalyTolerancePercent: 15,
      currentOdometerKm: 63120,
      driverId: driverOne.id
    }
  });

  const vehicleTwo = await prisma.vehicle.upsert({
    where: { registrationNumber: "AEP 4509" },
    update: {},
    create: {
      registrationNumber: "AEP 4509",
      make: "Nissan",
      model: "NP300",
      department: "Deliveries",
      fuelType: "Diesel",
      tankCapacityLitres: 75,
      expectedKmPerLitre: 8.8,
      anomalyTolerancePercent: 12,
      currentOdometerKm: 82440,
      driverId: driverTwo.id
    }
  });

  const purchaseCount = await prisma.fuelPurchase.count();
  if (purchaseCount === 0) {
    await prisma.fuelPurchase.createMany({
      data: [
        {
          supplier: "TotalEnergies Zimbabwe",
          invoiceNumber: "INV-FUEL-1001",
          purchasedAt: new Date("2026-04-01T08:00:00"),
          litres: 2500,
          unitCost: 1.54,
          totalCost: 3850,
          notes: "Opening monthly stock",
          createdById: accountant.id
        },
        {
          supplier: "Puma Energy",
          invoiceNumber: "INV-FUEL-1002",
          purchasedAt: new Date("2026-04-12T10:30:00"),
          litres: 1200,
          unitCost: 1.56,
          totalCost: 1872,
          notes: "Mid-month top-up",
          createdById: accountant.id
        }
      ]
    });
  }

  const allocationCount = await prisma.fuelAllocation.count();
  if (allocationCount === 0) {
    await prisma.fuelAllocation.createMany({
      data: [
        {
          vehicleId: vehicleOne.id,
          issuedAt: new Date("2026-04-13T09:00:00"),
          litres: 55,
          odometerKm: 63020,
          voucherNumber: "VCH-0001",
          purpose: "Customer deliveries",
          destination: "Harare CBD",
          remainingStockLitres: 3645,
          recordedById: accountant.id
        },
        {
          vehicleId: vehicleTwo.id,
          issuedAt: new Date("2026-04-14T11:15:00"),
          litres: 70,
          odometerKm: 82300,
          voucherNumber: "VCH-0002",
          purpose: "Branch transfer",
          destination: "Chitungwiza",
          remainingStockLitres: 3575,
          recordedById: accountant.id
        }
      ]
    });
  }

  const mileageCount = await prisma.mileageLog.count();
  if (mileageCount === 0) {
    await prisma.mileageLog.createMany({
      data: [
        {
          vehicleId: vehicleOne.id,
          recordedAt: new Date("2026-04-13T17:30:00"),
          odometerKm: 63480,
          distanceKm: 460,
          notes: "Daily delivery route",
          recordedById: operator.id
        },
        {
          vehicleId: vehicleTwo.id,
          recordedAt: new Date("2026-04-14T18:00:00"),
          odometerKm: 82820,
          distanceKm: 520,
          notes: "Branch stock transfer",
          recordedById: operator.id
        }
      ]
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "SEED",
      entity: "System",
      metadata: {
        message: "Seeded baseline users, drivers, vehicles, fuel purchases, allocations and mileage logs."
      }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
