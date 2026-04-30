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
        vehicle: { select: { registrationNumber: true } },
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
    const stockBefore = await getCurrentStockLitres();

    if (payload.litres > stockBefore) {
      throw new HttpError(409, "Fuel allocation exceeds available stock.", {
        requestedLitres: payload.litres,
        availableLitres: stockBefore
      });
    }

    const allocation = await prisma.$transaction(async (tx) => {
      const created = await tx.fuelAllocation.create({
        data: {
          ...payload,
          remainingStockLitres: roundNumber(stockBefore - payload.litres),
          recordedById: user.id
        },
        include: {
          vehicle: { select: { registrationNumber: true } },
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
        litres: payload.litres,
        remainingStockLitres: toNumber(allocation.remainingStockLitres)
      }
    });

    return NextResponse.json({ allocation: serializeAllocation(allocation) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
