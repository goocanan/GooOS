import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and } from "drizzle-orm";

// ─── DELETE /api/workspaces/[slug]/publishing/accounts/[accountId] ──
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; accountId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, accountId } = await params;

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

    const [account] = await db
      .select()
      .from(schema.platformAccounts)
      .where(
        and(
          eq(schema.platformAccounts.id, accountId),
          eq(schema.platformAccounts.workspaceId, workspace.id)
        )
      )
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const [deleted] = await db
      .delete(schema.platformAccounts)
      .where(eq(schema.platformAccounts.id, accountId))
      .returning({ id: schema.platformAccounts.id });

    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    // Log activity
    await db.insert(schema.activityLogs).values({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "platform_disconnected",
      entity: "publishing",
      entityId: accountId,
      metadata: { platform: account.platform },
    });

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error("Error disconnecting account:", error);
    return NextResponse.json({ error: "Failed to disconnect account" }, { status: 500 });
  }
}
