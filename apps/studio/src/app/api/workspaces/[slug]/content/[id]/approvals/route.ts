import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and, desc } from "drizzle-orm";

// ─── GET /api/workspaces/[slug]/content/[id]/approvals ────────
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

    const [content] = await db
      .select()
      .from(schema.content)
      .where(and(eq(schema.content.id, id), eq(schema.content.workspaceId, workspace.id)))
      .limit(1);

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const approvals = await db
      .select({
        id: schema.approvals.id,
        status: schema.approvals.status,
        reason: schema.approvals.reason,
        timestamp: schema.approvals.timestamp,
        createdAt: schema.approvals.createdAt,
        updatedAt: schema.approvals.updatedAt,
        reviewerId: schema.approvals.reviewerId,
        reviewerName: schema.users.name,
        reviewerEmail: schema.users.email,
      })
      .from(schema.approvals)
      .leftJoin(schema.users, eq(schema.approvals.reviewerId, schema.users.id))
      .where(eq(schema.approvals.contentId, id))
      .orderBy(desc(schema.approvals.createdAt));

    return NextResponse.json({ approvals });
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
}

// ─── POST /api/workspaces/[slug]/content/[id]/approvals ───────
// Request approval from a reviewer
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
    const { reviewerId } = body;

    if (!reviewerId) {
      return NextResponse.json({ error: "reviewerId is required" }, { status: 400 });
    }

    // Check reviewer is workspace member
    const [reviewer] = await db
      .select()
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspace.id),
          eq(schema.workspaceMembers.userId, reviewerId)
        )
      )
      .limit(1);

    if (!reviewer) {
      return NextResponse.json({ error: "Reviewer not found in workspace" }, { status: 404 });
    }

    // Create approval request
    const [newApproval] = await db
      .insert(schema.approvals)
      .values({
        contentId: id,
        reviewerId,
        status: "pending",
      })
      .returning();

    if (!newApproval) {
      return NextResponse.json({ error: "Failed to create approval request" }, { status: 500 });
    }

    return NextResponse.json({ approval: newApproval }, { status: 201 });
  } catch (error) {
    console.error("Error creating approval:", error);
    return NextResponse.json({ error: "Failed to create approval" }, { status: 500 });
  }
}
