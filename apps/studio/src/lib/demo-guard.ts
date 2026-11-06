import { NextRequest, NextResponse } from "next/server";
import { auth } from "@gooos/auth";

export const DEMO_USER_ID = "MaE2yRuQ8AlmZrFbXzXeNXqVX0QGUAoL";
export const DEMO_EMAIL = "demo@goocanan.com";

/**
 * Checks if the request originates from the demo user (read-only mode).
 */
export async function isDemoRequest(
  req: NextRequest,
  bodyUserId?: string | null
): Promise<boolean> {
  // 1. Check custom headers
  if (
    req.headers.get("x-demo-mode") === "true" ||
    req.headers.get("x-demo-user") === "true"
  ) {
    return true;
  }

  // 2. Check if bodyUserId matches demo user ID
  if (bodyUserId && bodyUserId === DEMO_USER_ID) {
    return true;
  }

  // 3. Check Better Auth Session
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    if (session?.user) {
      const email = session.user.email?.toLowerCase();
      if (
        session.user.id === DEMO_USER_ID ||
        email === DEMO_EMAIL ||
        email?.startsWith("demo@") ||
        (session.user as any).title === "demo_readonly"
      ) {
        return true;
      }
    }
  } catch (err) {
    // If auth session lookup fails, do not block regular operations
    console.error("Demo guard session check error:", err);
  }

  return false;
}

/**
 * Guard that halts mutation requests (POST, PUT, PATCH, DELETE) for demo accounts.
 * Returns a 403 Forbidden NextResponse if demo, or null if allowed to proceed.
 */
export async function blockIfDemo(
  req: NextRequest,
  bodyUserId?: string | null
): Promise<NextResponse | null> {
  const isDemo = await isDemoRequest(req, bodyUserId);
  if (isDemo) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Akses Ditolak: Akun demo hanya memiliki hak akses untuk melihat data (Mode Hanya Baca) dan tidak diizinkan untuk menginput atau mengubah data baru.",
        isDemoReadOnly: true,
      },
      { status: 403 }
    );
  }
  return null;
}
