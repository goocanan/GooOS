import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and } from "drizzle-orm";

// ─── PATCH /api/workspaces/[slug]/content/[id]/approvals/[approvalId] ──
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string; approvalId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, id, approvalId } = await params;

    const [workspace] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.slug, slug))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Verify current user is the reviewer or admin
    const [approval] = await db
      .select()
      .from(schema.approvals)
      .where(eq(schema.approvals.id, approvalId))
      .limit(1);

    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
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

    // Only reviewer, admin, or owner can update approval
    if (
      member?.userId !== approval.reviewerId &&
      member?.role !== "admin" &&
      member?.role !== "owner"
    ) {
      return NextResponse.json(
        { error: "Only the reviewer or admin can update this approval" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, reason } = body;

    if (!status || !["approved", "rejected", "changes_requested"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [updated] = await db
      .update(schema.approvals)
      .set({
        status,
        reason: reason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.approvals.id, approvalId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Failed to update approval" }, { status: 500 });
    }

    // If approved, auto-update content status
    if (status === "approved") {
      await db
        .update(schema.content)
        .set({ status: "approved" })
        .where(eq(schema.content.id, id));
    }

    return NextResponse.json({ approval: updated });
  } catch (error) {
    console.error("Error updating approval:", error);
    return NextResponse.json({ error: "Failed to update approval" }, { status: 500 });
  }
}
