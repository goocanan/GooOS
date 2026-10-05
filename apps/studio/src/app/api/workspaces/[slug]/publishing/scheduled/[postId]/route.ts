import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and } from "drizzle-orm";

// ─── PATCH /api/workspaces/[slug]/publishing/scheduled/[postId] ──────
// Publish now or unschedule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, postId } = await params;

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

    if (!member || (member.role !== "creator" && member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body; // "publish_now" or "unschedule"

    if (!action || !["publish_now", "unschedule"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const [post] = await db
      .select()
      .from(schema.scheduledPosts)
      .where(
        and(
          eq(schema.scheduledPosts.id, postId),
          eq(schema.scheduledPosts.workspaceId, workspace.id)
        )
      )
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (action === "unschedule") {
      const [deleted] = await db
        .delete(schema.scheduledPosts)
        .where(eq(schema.scheduledPosts.id, postId))
        .returning({ id: schema.scheduledPosts.id });

      if (!deleted) {
        return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
      }

      // Log activity
      await db.insert(schema.activityLogs).values({
        workspaceId: workspace.id,
        userId: session.user.id,
        action: "post_unscheduled",
        entity: "publishing",
        entityId: postId,
      });

      return NextResponse.json({ success: true, id: deleted.id });
    }

    if (action === "publish_now") {
      // Simulate immediate publishing
      const now = new Date();
      const [updated] = await db
        .update(schema.scheduledPosts)
        .set({
          status: "published",
          publishedAt: now,
          platformPostId: `post_${Date.now()}`, // Mock post ID
        })
        .where(eq(schema.scheduledPosts.id, postId))
        .returning();

      // Update content status
      if (post.contentId) {
        await db
          .update(schema.content)
          .set({ status: "published", publishedAt: now })
          .where(eq(schema.content.id, post.contentId));
      }

      // Log activity
      await db.insert(schema.activityLogs).values({
        workspaceId: workspace.id,
        userId: session.user.id,
        action: "post_published",
        entity: "content",
        entityId: post.contentId,
      });

      return NextResponse.json({ post: updated });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// ─── DELETE /api/workspaces/[slug]/publishing/scheduled/[postId] ────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, postId } = await params;

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
      .delete(schema.scheduledPosts)
      .where(
        and(
          eq(schema.scheduledPosts.id, postId),
          eq(schema.scheduledPosts.workspaceId, workspace.id)
        )
      )
      .returning({ id: schema.scheduledPosts.id });

    if (!deleted) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Log activity
    await db.insert(schema.activityLogs).values({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "post_deleted",
      entity: "publishing",
      entityId: postId,
    });

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
