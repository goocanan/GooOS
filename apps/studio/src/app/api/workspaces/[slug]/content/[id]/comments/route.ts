import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and, desc } from "drizzle-orm";

// ─── GET /api/workspaces/[slug]/content/[id]/comments ──────────
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

    // Verify workspace & membership
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

    // Verify content belongs to workspace
    const [content] = await db
      .select()
      .from(schema.content)
      .where(and(eq(schema.content.id, id), eq(schema.content.workspaceId, workspace.id)))
      .limit(1);

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Fetch comments with author info
    const comments = await db
      .select({
        id: schema.comments.id,
        body: schema.comments.body,
        timestamp: schema.comments.timestamp,
        createdAt: schema.comments.createdAt,
        updatedAt: schema.comments.updatedAt,
        userId: schema.comments.userId,
        userName: schema.users.name,
        userEmail: schema.users.email,
        parentCommentId: schema.comments.parentCommentId,
      })
      .from(schema.comments)
      .leftJoin(schema.users, eq(schema.comments.userId, schema.users.id))
      .where(eq(schema.comments.contentId, id))
      .orderBy(schema.comments.createdAt);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// ─── POST /api/workspaces/[slug]/content/[id]/comments ─────────
export async function POST(
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

    const [content] = await db
      .select()
      .from(schema.content)
      .where(and(eq(schema.content.id, id), eq(schema.content.workspaceId, workspace.id)))
      .limit(1);

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const body = await request.json();
    const { body: commentBody, timestamp, parentCommentId } = body;

    if (!commentBody || !commentBody.trim()) {
      return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
    }

    const [newComment] = await db
      .insert(schema.comments)
      .values({
        contentId: id,
        userId: session.user.id,
        body: commentBody.trim(),
        timestamp: timestamp ?? null,
        parentCommentId: parentCommentId ?? null,
      })
      .returning();

    if (!newComment) {
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    return NextResponse.json({
      comment: {
        ...newComment,
        userName: session.user.name,
        userEmail: session.user.email,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
