import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and } from "drizzle-orm";

// ─── GET /api/workspaces/[slug]/webhooks ──────────────────────────
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

    const webhooks = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.workspaceId, workspace.id));

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
  }
}

// ─── POST /api/workspaces/[slug]/webhooks ─────────────────────────
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
    const { name, url, events, secret } = body;

    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "name, url, and events are required" }, { status: 400 });
    }

    const validEvents = [
      "content.created", "content.updated", "content.published",
      "approval.requested", "approval.approved", "approval.rejected",
      "member.invited", "member.joined", "comment.created",
    ];

    const invalidEvents = events.filter((e: string) => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json({ error: `Invalid events: ${invalidEvents.join(", ")}` }, { status: 400 });
    }

    const [webhook] = await db
      .insert(schema.webhooks)
      .values({
        workspaceId: workspace.id,
        name,
        url,
        events,
        secret: secret || null,
        isActive: true,
      })
      .returning();

    if (!webhook) {
      return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
    }

    // Log activity
    await db.insert(schema.activityLogs).values({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "webhook_created",
      entity: "webhook",
      entityId: webhook.id,
      metadata: { name, events },
    });

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    console.error("Error creating webhook:", error);
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
  }
}
