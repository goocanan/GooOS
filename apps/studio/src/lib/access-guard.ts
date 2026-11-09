import { NextRequest, NextResponse } from "next/server";
import { auth } from "@gooos/auth";
import { db, schema } from "@gooos/db";
import { eq } from "drizzle-orm";

export const DEMO_USER_ID = "MaE2yRuQ8AlmZrFbXzXeNXqVX0QGUAoL";
export const DEMO_EMAIL = "demo@goocanan.com";
export const MAX_LIMITED_QUOTA = 5;

export interface UserAccessInfo {
  session: any | null;
  userId: string | null;
  email: string | null;
  name: string | null;
  role: "owner" | "admin" | "member_limited" | "demo" | "anonymous";
  isOwner: boolean;
  isDemo: boolean;
  isLimited: boolean;
  quotaUsed: number;
  quotaMax: number;
  remainingQuota: number;
  canCreate: boolean;
}

export async function getUserAccess(req: NextRequest): Promise<UserAccessInfo> {
  // Default anonymous state
  const defaultInfo: UserAccessInfo = {
    session: null,
    userId: null,
    email: null,
    name: null,
    role: "anonymous",
    isOwner: false,
    isDemo: false,
    isLimited: false,
    quotaUsed: 0,
    quotaMax: 0,
    remainingQuota: 0,
    canCreate: false,
  };

  try {
    // 1. Check custom headers for demo override
    if (
      req.headers.get("x-demo-mode") === "true" ||
      req.headers.get("x-demo-user") === "true"
    ) {
      return {
        ...defaultInfo,
        role: "demo",
        isDemo: true,
        email: DEMO_EMAIL,
        name: "Akun Demo (Hanya Baca)",
      };
    }

    // 2. Lookup Better Auth Session
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return defaultInfo;
    }

    const user = session.user;
    const email = user.email?.toLowerCase() || "";
    const userId = user.id;

    // 3. Check Demo User
    if (
      userId === DEMO_USER_ID ||
      email === DEMO_EMAIL ||
      email.startsWith("demo@") ||
      (user as any).title === "demo_readonly"
    ) {
      return {
        session,
        userId,
        email,
        name: user.name || "Akun Demo",
        role: "demo",
        isOwner: false,
        isDemo: true,
        isLimited: false,
        quotaUsed: 0,
        quotaMax: 0,
        remainingQuota: 0,
        canCreate: false,
      };
    }

    // 4. Check Owner / Admin Status
    const isOwnerEmail =
      email === "admin@goocanan.com" ||
      email === "james@goocanan3d.com" ||
      email === "james@goocanan.com";

    // Query workspace membership role
    let isOwnerRole = isOwnerEmail;
    if (!isOwnerRole) {
      const membership = await db
        .select({ role: schema.workspaceMembers.role })
        .from(schema.workspaceMembers)
        .where(eq(schema.workspaceMembers.userId, userId))
        .limit(1);

      if (membership[0]?.role === "owner" || membership[0]?.role === "admin") {
        isOwnerRole = true;
      }
    }

    if (isOwnerRole) {
      return {
        session,
        userId,
        email,
        name: user.name || "Owner Goocanan",
        role: "owner",
        isOwner: true,
        isDemo: false,
        isLimited: false,
        quotaUsed: 0,
        quotaMax: 9999,
        remainingQuota: 9999,
        canCreate: true,
      };
    }

    // 5. Limited Member (Newly registered accounts)
    // Count user's creations across products and orders
    const [userProducts, userOrders] = await Promise.all([
      db
        .select({ id: schema.flowProducts.id })
        .from(schema.flowProducts)
        .where(eq(schema.flowProducts.userId, userId)),
      db
        .select({ id: schema.flowOrders.id })
        .from(schema.flowOrders)
        .where(eq(schema.flowOrders.userId, userId)),
    ]);

    const quotaUsed = userProducts.length + userOrders.length;
    const remainingQuota = Math.max(0, MAX_LIMITED_QUOTA - quotaUsed);
    const canCreate = remainingQuota > 0;

    return {
      session,
      userId,
      email,
      name: user.name || "Member Terbatas",
      role: "member_limited",
      isOwner: false,
      isDemo: false,
      isLimited: true,
      quotaUsed,
      quotaMax: MAX_LIMITED_QUOTA,
      remainingQuota,
      canCreate,
    };
  } catch (err) {
    console.error("Access guard session check error:", err);
    return defaultInfo;
  }
}

/**
 * Guard that halts requests for demo or quota-exceeded limited users.
 * Returns null if allowed, or a NextResponse if rejected.
 */
export async function blockIfNotAllowed(
  req: NextRequest,
  actionType: "create" | "update" | "delete",
  targetOwnerId?: string | null
): Promise<NextResponse | null> {
  const access = await getUserAccess(req);

  // 1. Block Demo
  if (access.isDemo) {
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

  // 2. Owners/Admins have full access
  if (access.isOwner) {
    return null;
  }

  // 3. For Limited Members
  if (access.isLimited) {
    if (actionType === "create") {
      if (!access.canCreate) {
        return NextResponse.json(
          {
            success: false,
            error: `Batas Kuota Tercapai: Akun baru Anda memiliki akses terbatas uji coba (Maksimal ${access.quotaMax} data). Anda telah membuat ${access.quotaUsed} data. Silakan hubungi Administrator/Owner untuk upgrade ke Akses Penuh tanpa batas.`,
            isQuotaExceeded: true,
            quotaUsed: access.quotaUsed,
            quotaMax: access.quotaMax,
          },
          { status: 403 }
        );
      }
    } else if (actionType === "update" || actionType === "delete") {
      // Cannot modify/delete items created by others (especially the Owner)
      if (targetOwnerId && targetOwnerId !== access.userId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Akses Ditolak: Akun terbatas hanya diizinkan untuk mengedit atau menghapus data yang Anda buat sendiri. Data utama workspace dilindungi oleh Administrator.",
            isProtectedData: true,
          },
          { status: 403 }
        );
      }
    }
  }

  return null;
}
