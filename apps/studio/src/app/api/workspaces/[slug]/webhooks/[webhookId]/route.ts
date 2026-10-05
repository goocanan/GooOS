import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and } from "drizzle-orm";

// ─── PATCH /api/workspaces/[slug]/webhooks/[webhookId] ────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; webhookId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, webhookId } = await params;

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
    const { name, url, events, isActive, secret } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (events !== undefined) updateData.events = events;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (secret !== undefined) updateData.secret = secret;

    const [updated] = await db
      .update(schema.webhooks)
      .set(updateData)
      .where(
        and(
          eq(schema.webhooks.id, webhookId),
          eq(schema.webhooks.workspaceId, workspace.id)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({ webhook: updated });
  } catch (error) {
    console.error("Error updating webhook:", error);
    return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 });
  }
}

// ─── DELETE /api/workspaces/[slug]/webhooks/[webhookId] ───────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; webhookId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, webhookId } = await params;

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
      .delete(schema.webhooks)
      .where(
        and(
          eq(schema.webhooks.id, webhookId),
          eq(schema.webhooks.workspaceId, workspace.id)
        )
      )
      .returning({ id: schema.webhooks.id });

    if (!deleted) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Log activity
    await db.insert(schema.activityLogs).values({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "webhook_deleted",
      entity: "webhook",
      entityId: webhookId,
    });

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
  }
}
