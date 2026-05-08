import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireApiUser } from "@/lib/api";
import { fuelPurchaseCreateSchema } from "@/lib/validation";
import { currencyTotal } from "@/lib/number";
import { serializePurchase } from "@/lib/serializers";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser(["ADMIN", "ACCOUNTANT"]);
    const purchases = await prisma.fuelPurchase.findMany({
      include: { createdBy: { select: { name: true, email: true } } },
      orderBy: { purchasedAt: "desc" },
      take: 200
    });

    return NextResponse.json({ purchases: purchases.map(serializePurchase) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(["ADMIN", "ACCOUNTANT"]);
    const payload = fuelPurchaseCreateSchema.parse(await request.json());
    const purchase = await prisma.fuelPurchase.create({
      data: {
        ...payload,
        totalCost: currencyTotal(payload.litres, payload.unitCost),
        createdById: user.id
      },
      include: { createdBy: { select: { name: true, email: true } } }
    });

    await writeAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "FuelPurchase",
      entityId: purchase.id,
      metadata: { fuelType: payload.fuelType, litres: payload.litres, supplier: payload.supplier }
    });

    return NextResponse.json({ purchase: serializePurchase(purchase) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
