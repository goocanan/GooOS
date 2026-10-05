import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and, desc } from "drizzle-orm";

// ─── GET /api/workspaces/[slug]/notifications ─────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const [workspace] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.slug, slug))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const [member] = await db
      .select()
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspace.id),
          eq(schema.workspaceMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    let query = db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.workspaceId, workspace.id),
          eq(schema.notifications.userId, session.user.id)
        )
      )
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit);

    if (unreadOnly) {
      query = db
        .select()
        .from(schema.notifications)
        .where(
          and(
            eq(schema.notifications.workspaceId, workspace.id),
            eq(schema.notifications.userId, session.user.id),
            eq(schema.notifications.read, false)
          )
        )
        .orderBy(desc(schema.notifications.createdAt))
        .limit(limit);
    }

    const notifications = await query;

    // Count unread
    const unreadCount = await db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.workspaceId, workspace.id),
          eq(schema.notifications.userId, session.user.id),
          eq(schema.notifications.read, false)
        )
      );

    return NextResponse.json({
      notifications,
      unreadCount: unreadCount.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// ─── PATCH /api/workspaces/[slug]/notifications ──────────────
// Mark all as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const [workspace] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.slug, slug))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const [member] = await db
      .select()
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspace.id),
          eq(schema.workspaceMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db
      .update(schema.notifications)
      .set({ read: true })
      .where(
        and(
          eq(schema.notifications.workspaceId, workspace.id),
          eq(schema.notifications.userId, session.user.id),
          eq(schema.notifications.read, false)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications read:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
