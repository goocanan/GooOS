import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and } from "drizzle-orm";

// ─── PATCH /api/workspaces/[slug]/automation/[ruleId] ─────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; ruleId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, ruleId } = await params;

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

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, trigger, conditions, actions, isActive } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (trigger !== undefined) updateData.trigger = trigger;
    if (conditions !== undefined) updateData.conditions = conditions;
    if (actions !== undefined) updateData.actions = actions;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updated] = await db
      .update(schema.automationRules)
      .set(updateData)
      .where(
        and(
          eq(schema.automationRules.id, ruleId),
          eq(schema.automationRules.workspaceId, workspace.id)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({ rule: updated });
  } catch (error) {
    console.error("Error updating automation rule:", error);
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }
}

// ─── DELETE /api/workspaces/[slug]/automation/[ruleId] ────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; ruleId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, ruleId } = await params;

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

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [deleted] = await db
      .delete(schema.automationRules)
      .where(
        and(
          eq(schema.automationRules.id, ruleId),
          eq(schema.automationRules.workspaceId, workspace.id)
        )
      )
      .returning({ id: schema.automationRules.id });

    if (!deleted) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    // Log activity
    await db.insert(schema.activityLogs).values({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "automation_deleted",
      entity: "automation",
      entityId: ruleId,
    });

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error("Error deleting automation rule:", error);
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
