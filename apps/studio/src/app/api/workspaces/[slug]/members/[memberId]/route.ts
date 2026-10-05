import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and } from "drizzle-orm";

// ─── PATCH /api/workspaces/[slug]/members/[memberId] ─────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; memberId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, memberId } = await params;

    const [workspace] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.slug, slug))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const [currentMember] = await db
      .select()
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspace.id),
          eq(schema.workspaceMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin")) {
      return NextResponse.json(
        { error: "Only workspace owners and admins can update roles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["admin", "manager", "creator", "reviewer", "client"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Prevent changing owner's role
    const [targetMember] = await db
      .select()
      .from(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.id, memberId))
      .limit(1);

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Only owner can demote an admin
    if (targetMember.role === "owner") {
      return NextResponse.json({ error: "Cannot modify workspace owner" }, { status: 403 });
    }

    const [updated] = await db
      .update(schema.workspaceMembers)
      .set({ role })
      .where(eq(schema.workspaceMembers.id, memberId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
    }

    // Log activity
    await db.insert(schema.activityLogs).values({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "member_role_changed",
      entity: "workspace",
      entityId: workspace.id,
      metadata: { targetUserId: targetMember.userId, newRole: role },
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

// ─── DELETE /api/workspaces/[slug]/members/[memberId] ────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; memberId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, memberId } = await params;

    const [workspace] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.slug, slug))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const [currentMember] = await db
      .select()
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspace.id),
          eq(schema.workspaceMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin")) {
      return NextResponse.json(
        { error: "Only workspace owners and admins can remove members" },
        { status: 403 }
      );
    }

    const [targetMember] = await db
      .select()
      .from(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.id, memberId))
      .limit(1);

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Cannot remove owner
    if (targetMember.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove workspace owner" },
        { status: 403 }
      );
    }

    // Cannot remove self if admin (only owner can remove admin)
    if (targetMember.userId === session.user.id && currentMember.role !== "owner") {
      return NextResponse.json(
        { error: "Admins cannot remove themselves" },
        { status: 403 }
      );
    }

    const [deleted] = await db
      .delete(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.id, memberId))
      .returning({ id: schema.workspaceMembers.id });

    if (!deleted) {
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }

    // Log activity
    await db.insert(schema.activityLogs).values({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "member_removed",
      entity: "workspace",
      entityId: workspace.id,
      metadata: { removedUserId: targetMember.userId },
    });

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
