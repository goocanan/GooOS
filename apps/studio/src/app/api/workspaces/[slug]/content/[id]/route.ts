import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and } from "drizzle-orm";

// ─── GET /api/workspaces/[slug]/content/[id] ──────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, id } = await params;

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

    // Fetch content with related data
    const [contentItem] = await db
      .select()
      .from(schema.content)
      .where(and(eq(schema.content.id, id), eq(schema.content.workspaceId, workspace.id)))
      .limit(1);

    if (!contentItem) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Fetch latest script version
    const scripts = await db
      .select()
      .from(schema.scripts)
      .where(eq(schema.scripts.contentId, id))
      .orderBy(schema.scripts.version);

    // Fetch comments
    const comments = await db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.contentId, id))
      .orderBy(schema.comments.createdAt);

    // Fetch approvals
    const approvals = await db
      .select()
      .from(schema.approvals)
      .where(eq(schema.approvals.contentId, id))
      .orderBy(schema.approvals.createdAt);

    // Fetch linked assets
    const linkedAssets = await db
      .select({
        id: schema.assets.id,
        name: schema.assets.name,
        type: schema.assets.type,
        url: schema.assets.url,
        thumbnailUrl: schema.assets.thumbnailUrl,
        size: schema.assets.size,
        role: schema.contentAssets.role,
      })
      .from(schema.contentAssets)
      .innerJoin(schema.assets, eq(schema.contentAssets.assetId, schema.assets.id))
      .where(eq(schema.contentAssets.contentId, id));

    return NextResponse.json({
      content: contentItem,
      scripts,
      comments,
      approvals,
      assets: linkedAssets,
    });
  } catch (error) {
    console.error("Error fetching content detail:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

// ─── PATCH /api/workspaces/[slug]/content/[id] ────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, id } = await params;

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

    const body = await request.json();
    const updates: Record<string, any> = {};

    // Only allow specific fields to be updated
    const allowedFields = [
      "title",
      "description",
      "type",
      "status",
      "priority",
      "tags",
      "deadline",
      "scheduledAt",
      "brandId",
      "campaignId",
      "ownerId",
      "creatorId",
      "reviewerId",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    updates.updatedAt = new Date();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const [updated] = await db
      .update(schema.content)
      .set(updates)
      .where(and(eq(schema.content.id, id), eq(schema.content.workspaceId, workspace.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Content not found or not updated" }, { status: 404 });
    }

    return NextResponse.json({ content: updated });
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
  }
}

// ─── DELETE /api/workspaces/[slug]/content/[id] ───────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, id } = await params;

    const [workspace] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.slug, slug))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Only Owner/Admin can delete content
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
      return NextResponse.json(
        { error: "Only workspace owners and admins can delete content" },
        { status: 403 }
      );
    }

    const [deleted] = await db
      .delete(schema.content)
      .where(and(eq(schema.content.id, id), eq(schema.content.workspaceId, workspace.id)))
      .returning({ id: schema.content.id });

    if (!deleted) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
  }
}
