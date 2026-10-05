import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and, gte, lte } from "drizzle-orm";

type ScheduleStatus = "scheduled" | "publishing" | "published" | "failed";

// ─── GET /api/workspaces/[slug]/publishing/scheduled ───────────────
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
    const status = searchParams.get("status") as ScheduleStatus | null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    let query = db
      .select({
        scheduled: schema.scheduledPosts,
        contentTitle: schema.content.title,
        platformName: schema.platformAccounts.displayName,
      })
      .from(schema.scheduledPosts)
      .leftJoin(schema.content, eq(schema.scheduledPosts.contentId, schema.content.id))
      .leftJoin(schema.platformAccounts, eq(schema.scheduledPosts.platformAccountId, schema.platformAccounts.id))
      .where(eq(schema.scheduledPosts.workspaceId, workspace.id))
      .limit(limit);

    if (status) {
      query = db
        .select({
          scheduled: schema.scheduledPosts,
          contentTitle: schema.content.title,
          platformName: schema.platformAccounts.displayName,
        })
        .from(schema.scheduledPosts)
        .leftJoin(schema.content, eq(schema.scheduledPosts.contentId, schema.content.id))
        .leftJoin(schema.platformAccounts, eq(schema.scheduledPosts.platformAccountId, schema.platformAccounts.id))
        .where(
          and(
            eq(schema.scheduledPosts.workspaceId, workspace.id),
            eq(schema.scheduledPosts.status, status)
          )
        )
        .limit(limit);
    }

    const posts = await query;

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// ─── POST /api/workspaces/[slug]/publishing/scheduled ────────────────
// Schedule content for publishing
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

    if (!member || (member.role !== "creator" && member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { contentId, platformAccountIds, scheduledAt, timezone } = body;

    if (!contentId || !platformAccountIds || !Array.isArray(platformAccountIds) || platformAccountIds.length === 0) {
      return NextResponse.json({ error: "contentId and platformAccountIds are required" }, { status: 400 });
    }

    if (!scheduledAt) {
      return NextResponse.json({ error: "scheduledAt is required" }, { status: 400 });
    }

    // Verify content ownership
    const [content] = await db
      .select()
      .from(schema.content)
      .where(
        and(
          eq(schema.content.id, contentId),
          eq(schema.content.workspaceId, workspace.id)
        )
      )
      .limit(1);

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Create scheduled posts for each platform
    const createdPosts = [];
    for (const platformAccountId of platformAccountIds) {
      const [post] = await db
        .insert(schema.scheduledPosts)
        .values({
          workspaceId: workspace.id,
          contentId,
          platformAccountId,
          scheduledAt: new Date(scheduledAt),
          timezone: timezone || "Asia/Jakarta",
          status: "scheduled",
        })
        .returning();

      if (post) {
        createdPosts.push(post);
      }
    }

    // Log activity
    await db.insert(schema.activityLogs).values({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "post_scheduled",
      entity: "content",
      entityId: contentId,
      metadata: { platformCount: platformAccountIds.length, scheduledAt },
    });

    return NextResponse.json({ posts: createdPosts }, { status: 201 });
  } catch (error) {
    console.error("Error scheduling post:", error);
    return NextResponse.json({ error: "Failed to schedule post" }, { status: 500 });
  }
}
