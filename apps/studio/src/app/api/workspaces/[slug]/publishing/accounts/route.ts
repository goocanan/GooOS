import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and } from "drizzle-orm";

// ─── GET /api/workspaces/[slug]/publishing/accounts ────────────
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

    const accounts = await db
      .select()
      .from(schema.platformAccounts)
      .where(eq(schema.platformAccounts.workspaceId, workspace.id));

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

// ─── POST /api/workspaces/[slug]/publishing/accounts ─────────────
// Connect social media account (mock OAuth flow)
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
    const { platform, accountId, accountName, accessToken, refreshToken } = body;

    if (!platform || !["instagram", "tiktok", "youtube", "twitter", "facebook", "linkedin"].includes(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    // Check if already connected
    const [existing] = await db
      .select()
      .from(schema.platformAccounts)
      .where(
        and(
          eq(schema.platformAccounts.workspaceId, workspace.id),
          eq(schema.platformAccounts.platform, platform),
          eq(schema.platformAccounts.accountId, accountId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Account already connected" }, { status: 409 });
    }

    const [account] = await db
      .insert(schema.platformAccounts)
      .values({
        workspaceId: workspace.id,
        platform,
        accountId,
        displayName: accountName,
        accessToken: accessToken || "mock-token",
        refreshToken: refreshToken || null,
        connectedAt: new Date(),
      })
      .returning();

    if (!account) {
      return NextResponse.json({ error: "Failed to create account record" }, { status: 500 });
    }

    // Log activity
    await db.insert(schema.activityLogs).values({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "platform_connected",
      entity: "publishing",
      entityId: account.id,
      metadata: { platform, accountName },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("Error connecting account:", error);
    return NextResponse.json({ error: "Failed to connect account" }, { status: 500 });
  }
}
