import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and } from "drizzle-orm";

// ─── GET /api/workspaces/[slug]/automation ────────────────────────
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

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rules = await db
      .select()
      .from(schema.automationRules)
      .where(eq(schema.automationRules.workspaceId, workspace.id));

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Error fetching automation rules:", error);
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

// ─── POST /api/workspaces/[slug]/automation ───────────────────────
export async function POST(
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

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, trigger, conditions, actions, isActive } = body;

    if (!name || !trigger || !actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json({ error: "name, trigger, and actions are required" }, { status: 400 });
    }

    const validTriggers = [
      "content.status_changed",
      "content.created",
      "approval.submitted",
      "approval.approved",
      "member.joined",
      "schedule.due",
    ];

    if (!validTriggers.includes(trigger)) {
      return NextResponse.json({ error: `Invalid trigger: ${trigger}` }, { status: 400 });
    }

    const [rule] = await db
      .insert(schema.automationRules)
      .values({
        workspaceId: workspace.id,
        name,
        trigger,
        conditions: conditions || {},
        actions,
        isActive: isActive !== false,
      })
      .returning();

    if (!rule) {
      return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
    }

    // Log activity
    await db.insert(schema.activityLogs).values({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "automation_created",
      entity: "automation",
      entityId: rule.id,
      metadata: { name, trigger },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("Error creating automation rule:", error);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}
