import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireApiUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser(["ADMIN"]);
    const auditLogs = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 250
    });

    return NextResponse.json({
      auditLogs: auditLogs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString()
      }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}
