import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireApiUser } from "@/lib/api";
import { driverCreateSchema } from "@/lib/validation";
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
