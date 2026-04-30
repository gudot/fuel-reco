import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireApiUser } from "@/lib/api";
import { mileageLogCreateSchema } from "@/lib/validation";
import { serializeMileageLog } from "@/lib/serializers";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser();
    const mileageLogs = await prisma.mileageLog.findMany({
      include: {
        vehicle: { select: { registrationNumber: true } },
        recordedBy: { select: { name: true, email: true } }
      },
      orderBy: { recordedAt: "desc" },
      take: 200
    });

    return NextResponse.json({ mileageLogs: mileageLogs.map(serializeMileageLog) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(["ADMIN", "ACCOUNTANT", "OPERATIONS"]);
    const payload = mileageLogCreateSchema.parse(await request.json());
    const mileageLog = await prisma.$transaction(async (tx) => {
      const created = await tx.mileageLog.create({
        data: {
          ...payload,
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
      entity: "MileageLog",
      entityId: mileageLog.id,
      metadata: {
        vehicleId: payload.vehicleId,
        distanceKm: payload.distanceKm,
        odometerKm: payload.odometerKm
      }
    });

    return NextResponse.json({ mileageLog: serializeMileageLog(mileageLog) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
