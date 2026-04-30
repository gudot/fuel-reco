import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth";
import type { RoleName, SessionUser } from "@/lib/types";

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function requireApiUser(roles?: RoleName[]): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new HttpError(401, "Authentication is required.");
  }

  if (roles && !roles.includes(user.role)) {
    throw new HttpError(403, "You do not have permission to perform this action.");
  }

  return user;
}

export function handleApiError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        details: error.flatten()
      },
      { status: 422 }
    );
  }

  console.error(error);
  return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
}
