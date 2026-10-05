import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and, desc } from "drizzle-orm";

// ─── GET /api/workspaces/[slug]/brands ───────────────────────
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

    const brands = await db
      .select()
      .from(schema.brands)
      .where(eq(schema.brands.workspaceId, workspace.id))
      .orderBy(desc(schema.brands.updatedAt));

    return NextResponse.json({ brands });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
  }
}

// ─── POST /api/workspaces/[slug]/brands ──────────────────────
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

    // Only admin/owner can create brands
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json(
        { error: "Only workspace owners and admins can create brands" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, website, instagram, tiktok, youtube, facebook, primaryColor, secondaryColor } = body;

    if (!name) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }

    // Generate slug from name
    const brandSlug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // Check slug uniqueness
    const [existing] = await db
      .select()
      .from(schema.brands)
      .where(
        and(
          eq(schema.brands.workspaceId, workspace.id),
          eq(schema.brands.slug, brandSlug)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Brand slug already exists" }, { status: 409 });
    }

    const [newBrand] = await db
      .insert(schema.brands)
      .values({
        workspaceId: workspace.id,
        name,
        slug: brandSlug,
        description: description ?? null,
        website: website ?? null,
        instagram: instagram ?? null,
        tiktok: tiktok ?? null,
        youtube: youtube ?? null,
        facebook: facebook ?? null,
        primaryColor: primaryColor ?? null,
        secondaryColor: secondaryColor ?? null,
      })
      .returning();

    if (!newBrand) {
      return NextResponse.json({ error: "Failed to create brand" }, { status: 500 });
    }

    return NextResponse.json({ brand: newBrand }, { status: 201 });
  } catch (error) {
    console.error("Error creating brand:", error);
    return NextResponse.json({ error: "Failed to create brand" }, { status: 500 });
  }
}
