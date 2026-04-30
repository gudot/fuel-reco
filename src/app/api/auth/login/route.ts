import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSessionToken, getCookieOptions, SESSION_COOKIE } from "@/lib/auth";
import { handleApiError, HttpError } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { email: payload.email }
    });

    if (!user || !user.active) {
      throw new HttpError(401, "Invalid email or password.");
    }

    const validPassword = await bcrypt.compare(payload.password, user.passwordHash);

    if (!validPassword) {
      throw new HttpError(401, "Invalid email or password.");
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    const token = await createSessionToken(sessionUser);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, getCookieOptions());

    await writeAuditLog({
      userId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id
    });

    return NextResponse.json({ user: sessionUser });
  } catch (error) {
    return handleApiError(error);
  }
}
