import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, HttpError, requireApiUser } from "@/lib/api";
import { vehicleCreateSchema, vehicleUpdateSchema } from "@/lib/validation";
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

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser(["ADMIN"]);
    const id = new URL(request.url).searchParams.get("id");

    if (!id) {
      throw new HttpError(400, "Vehicle id is required.");
    }

    const payload = vehicleUpdateSchema.parse(await request.json());
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: payload,
      include: { driver: true }
    });

    await writeAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Vehicle",
      entityId: vehicle.id,
      metadata: payload
    });

    return NextResponse.json({ vehicle: serializeVehicle(vehicle) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireApiUser(["ADMIN"]);
    const id = new URL(request.url).searchParams.get("id");

    if (!id) {
      throw new HttpError(400, "Vehicle id is required.");
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { active: false },
      include: { driver: true }
    });

    await writeAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "Vehicle",
      entityId: vehicle.id,
      metadata: { registrationNumber: vehicle.registrationNumber }
    });

    return NextResponse.json({ vehicle: serializeVehicle(vehicle) });
  } catch (error) {
    return handleApiError(error);
  }
}
