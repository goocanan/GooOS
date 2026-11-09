import { NextRequest, NextResponse } from "next/server";
import {
  getUserAccess,
  blockIfNotAllowed,
  DEMO_USER_ID,
  DEMO_EMAIL,
} from "./access-guard";

export { DEMO_USER_ID, DEMO_EMAIL };

/**
 * Checks if the request originates from the demo user (read-only mode).
 */
export async function isDemoRequest(
  req: NextRequest,
  bodyUserId?: string | null
): Promise<boolean> {
  const access = await getUserAccess(req);
  return access.isDemo;
}

/**
 * Guard that halts mutation requests:
 * - Halts demo users (read-only)
 * - Halts limited members who have exceeded their creation quota
 * - Halts limited members trying to edit/delete items created by others
 */
export async function blockIfDemo(
  req: NextRequest,
  bodyUserId?: string | null,
  actionType: "create" | "update" | "delete" = "create",
  targetOwnerId?: string | null
): Promise<NextResponse | null> {
  return blockIfNotAllowed(req, actionType, targetOwnerId || bodyUserId);
}
