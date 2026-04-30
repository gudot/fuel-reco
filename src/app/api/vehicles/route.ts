import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireApiUser } from "@/lib/api";
import { vehicleCreateSchema } from "@/lib/validation";
import { serializeVehicle } from "@/lib/serializers";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser();
    const vehicles = await prisma.vehicle.findMany({
      include: { driver: true },
      orderBy: { registrationNumber: "asc" }
    });

    return NextResponse.json({ vehicles: vehicles.map(serializeVehicle) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(["ADMIN"]);
    const payload = vehicleCreateSchema.parse(await request.json());
    const vehicle = await prisma.vehicle.create({
      data: payload,
      include: { driver: true }
    });

    await writeAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Vehicle",
      entityId: vehicle.id,
      metadata: payload
    });

    return NextResponse.json({ vehicle: serializeVehicle(vehicle) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
