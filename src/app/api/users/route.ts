import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, HttpError, requireApiUser } from "@/lib/api";
import { userCreateSchema, userUpdateSchema } from "@/lib/validation";
import { serializeUser } from "@/lib/serializers";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser(["ADMIN"]);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    return NextResponse.json({ users: users.map(serializeUser) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireApiUser(["ADMIN"]);
    const payload = userCreateSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(payload.password, 12);

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        role: payload.role,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    await writeAuditLog({
      userId: currentUser.id,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      metadata: { email: user.email, role: user.role }
    });

    return NextResponse.json({ user: serializeUser(user) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await requireApiUser(["ADMIN"]);
    const id = new URL(request.url).searchParams.get("id");

    if (!id) {
      throw new HttpError(400, "User id is required.");
    }

    const payload = userUpdateSchema.parse(await request.json());
    const { password, ...userFields } = payload;
    const data = {
      ...userFields,
      ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {})
    };

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    await writeAuditLog({
      userId: currentUser.id,
      action: "UPDATE",
      entity: "User",
      entityId: user.id,
      metadata: { email: user.email, role: user.role, active: user.active }
    });

    return NextResponse.json({ user: serializeUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await requireApiUser(["ADMIN"]);
    const id = new URL(request.url).searchParams.get("id");

    if (!id) {
      throw new HttpError(400, "User id is required.");
    }

    if (id === currentUser.id) {
      throw new HttpError(409, "You cannot deactivate your own account.");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { active: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    await writeAuditLog({
      userId: currentUser.id,
      action: "DELETE",
      entity: "User",
      entityId: user.id,
      metadata: { email: user.email }
    });

    return NextResponse.json({ user: serializeUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
