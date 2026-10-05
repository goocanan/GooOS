import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await db.query.workspaces.findFirst({
      where: (w, { eq }) => eq(w.slug, slug),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Workspace slug already taken" },
        { status: 400 }
      );
    }

    // Create workspace
    const [workspace] = await db
      .insert(schema.workspaces)
      .values({
        name,
        slug,
        description: description ?? null,
      })
      .returning();

    if (!workspace) {
      return NextResponse.json(
        { error: "Failed to create workspace" },
        { status: 500 }
      );
    }

    // Add user as owner
    await db.insert(schema.workspaceMembers).values({
      workspaceId: workspace.id,
      userId: session.user.id,
      role: "owner",
    });

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all workspaces where user is a member
    const memberships = await db.query.workspaceMembers.findMany({
      where: (wm, { eq }) => eq(wm.userId, session.user.id),
      with: {
        workspace: true,
      },
    });

    const workspaces = memberships.map((m) => ({
      ...m.workspace!,
      role: m.role,
    }));

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}
