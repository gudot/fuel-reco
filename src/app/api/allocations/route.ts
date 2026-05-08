import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, HttpError, requireApiUser } from "@/lib/api";
import { fuelAllocationCreateSchema } from "@/lib/validation";
import { getCurrentStockLitres } from "@/lib/reconciliation";
import { roundNumber, toNumber } from "@/lib/number";
import { serializeAllocation } from "@/lib/serializers";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser();
    const allocations = await prisma.fuelAllocation.findMany({
      include: {
        vehicle: { select: { registrationNumber: true, fuelType: true } },
        recordedBy: { select: { name: true, email: true } }
      },
      orderBy: { issuedAt: "desc" },
      take: 200
    });

    return NextResponse.json({ allocations: allocations.map(serializeAllocation) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(["ADMIN", "ACCOUNTANT"]);
    const payload = fuelAllocationCreateSchema.parse(await request.json());
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: payload.vehicleId },
      select: { id: true, fuelType: true, registrationNumber: true }
    });

    if (!vehicle) {
      throw new HttpError(404, "Vehicle not found.");
    }

    const stockBefore = await getCurrentStockLitres(vehicle.fuelType);

    if (payload.litres > stockBefore) {
      throw new HttpError(409, `${vehicle.fuelType} allocation exceeds available stock.`, {
        fuelType: vehicle.fuelType,
        requestedLitres: payload.litres,
        availableLitres: stockBefore
      });
    }

    const allocation = await prisma.$transaction(async (tx) => {
      const created = await tx.fuelAllocation.create({
        data: {
          ...payload,
          fuelType: vehicle.fuelType,
          remainingStockLitres: roundNumber(stockBefore - payload.litres),
          recordedById: user.id
        },
        include: {
          vehicle: { select: { registrationNumber: true, fuelType: true } },
          recordedBy: { select: { name: true, email: true } }
        }
      });

      await tx.vehicle.update({
        where: { id: payload.vehicleId },
        data: { currentOdometerKm: payload.odometerKm }
      });

      return created;
    });

    await writeAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "FuelAllocation",
      entityId: allocation.id,
      metadata: {
        vehicleId: payload.vehicleId,
        fuelType: vehicle.fuelType,
        litres: payload.litres,
        remainingStockLitres: toNumber(allocation.remainingStockLitres)
      }
    });

    return NextResponse.json({ allocation: serializeAllocation(allocation) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
