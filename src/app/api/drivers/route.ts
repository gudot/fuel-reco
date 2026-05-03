import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, HttpError, requireApiUser } from "@/lib/api";
import { driverCreateSchema, driverUpdateSchema } from "@/lib/validation";
import { serializeDriver } from "@/lib/serializers";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser();
    const drivers = await prisma.driver.findMany({
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ drivers: drivers.map(serializeDriver) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(["ADMIN"]);
    const payload = driverCreateSchema.parse(await request.json());
    const driver = await prisma.driver.create({ data: payload });

    await writeAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Driver",
      entityId: driver.id,
      metadata: payload
    });

    return NextResponse.json({ driver: serializeDriver(driver) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser(["ADMIN"]);
    const id = new URL(request.url).searchParams.get("id");

    if (!id) {
      throw new HttpError(400, "Driver id is required.");
    }

    const payload = driverUpdateSchema.parse(await request.json());
    const driver = await prisma.driver.update({
      where: { id },
      data: payload
    });

    await writeAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Driver",
      entityId: driver.id,
      metadata: payload
    });

    return NextResponse.json({ driver: serializeDriver(driver) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireApiUser(["ADMIN"]);
    const id = new URL(request.url).searchParams.get("id");

    if (!id) {
      throw new HttpError(400, "Driver id is required.");
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: { active: false }
    });

    await writeAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "Driver",
      entityId: driver.id,
      metadata: { name: driver.name }
    });

    return NextResponse.json({ driver: serializeDriver(driver) });
  } catch (error) {
    return handleApiError(error);
  }
}
