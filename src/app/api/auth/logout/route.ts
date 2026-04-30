import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser, SESSION_COOKIE } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);

  if (user) {
    await writeAuditLog({
      userId: user.id,
      action: "LOGOUT",
      entity: "User",
      entityId: user.id
    });
  }

  return NextResponse.json({ ok: true });
}
