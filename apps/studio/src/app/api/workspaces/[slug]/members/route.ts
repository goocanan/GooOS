import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and, desc } from "drizzle-orm";

// ─── GET /api/workspaces/[slug]/members ───────────────────────
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

    // Fetch members with user info
    const members = await db
      .select({
        id: schema.workspaceMembers.id,
        role: schema.workspaceMembers.role,
        invitedAt: schema.workspaceMembers.invitedAt,
        joinedAt: schema.workspaceMembers.joinedAt,
        userId: schema.workspaceMembers.userId,
        userName: schema.users.name,
        userEmail: schema.users.email,
        userAvatar: schema.users.avatarUrl,
      })
      .from(schema.workspaceMembers)
      .leftJoin(schema.users, eq(schema.workspaceMembers.userId, schema.users.id))
      .where(eq(schema.workspaceMembers.workspaceId, workspace.id))
      .orderBy(desc(schema.workspaceMembers.joinedAt));

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

// ─── POST /api/workspaces/[slug]/members ──────────────────────
// Invite by email (creates placeholder user if not exists)
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

    // Only owner/admin can invite
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json(
        { error: "Only workspace owners and admins can invite members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    if (!["admin", "manager", "creator", "reviewer", "client"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Find or create user by email
    let [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user) {
      // Create placeholder user (will need to set password later)
      const [newUser] = await db
        .insert(schema.users)
        .values({
          email,
          name: email.split("@")[0],
          emailVerified: false,
        })
        .returning();
    if (!newUser) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
    user = newUser;
    }

    // Check if already member
    const [existing] = await db
      .select()
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspace.id),
          eq(schema.workspaceMembers.userId, user.id)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "User is already a member" }, { status: 409 });
    }

    const [newMember] = await db
      .insert(schema.workspaceMembers)
      .values({
        workspaceId: workspace.id,
        userId: user.id,
        role,
        invitedAt: new Date(),
      })
      .returning();

    // Create notification for invited user
    await db.insert(schema.notifications).values({
      workspaceId: workspace.id,
      userId: user.id,
      type: "system",
      title: `Invited to ${workspace.name}`,
      body: `You have been invited to join ${workspace.name} as ${role}`,
      link: `/w/${slug}`,
    });

    // Log activity
    await db.insert(schema.activityLogs).values({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "member_invited",
      entity: "workspace",
      entityId: workspace.id,
      metadata: { invitedUserId: user.id, role },
    });

    return NextResponse.json(
      { member: { ...newMember, userName: user.name, userEmail: user.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inviting member:", error);
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 });
  }
}
