import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and, desc } from "drizzle-orm";

// ─── GET /api/workspaces/[slug]/assets ────────────────────────
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

    const assets = await db
      .select({
        id: schema.assets.id,
        name: schema.assets.name,
        type: schema.assets.type,
        size: schema.assets.size,
        mimeType: schema.assets.mimeType,
        url: schema.assets.url,
        thumbnailUrl: schema.assets.thumbnailUrl,
        resolution: schema.assets.resolution,
        duration: schema.assets.duration,
        tags: schema.assets.tags,
        createdAt: schema.assets.createdAt,
        brandName: schema.brands.name,
      })
      .from(schema.assets)
      .leftJoin(schema.brands, eq(schema.assets.brandId, schema.brands.id))
      .where(eq(schema.assets.workspaceId, workspace.id))
      .orderBy(desc(schema.assets.createdAt));

    return NextResponse.json({ assets });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

// ─── POST /api/workspaces/[slug]/assets ───────────────────────
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

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For now, accept JSON metadata (real file upload needs S3/R2 integration)
    const body = await request.json();
    const { name, type, size, mimeType, url, thumbnailUrl, resolution, duration, tags, brandId } = body;

    if (!name || !type || !size || !url) {
      return NextResponse.json(
        { error: "name, type, size, and url are required" },
        { status: 400 }
      );
    }

    const [newAsset] = await db
      .insert(schema.assets)
      .values({
        workspaceId: workspace.id,
        name,
        type,
        size,
        mimeType: mimeType ?? null,
        url,
        thumbnailUrl: thumbnailUrl ?? null,
        resolution: resolution ?? null,
        duration: duration ?? null,
        tags: tags ?? [],
        brandId: brandId ?? null,
        uploadedById: session.user.id,
      })
      .returning();

    if (!newAsset) {
      return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
    }

    return NextResponse.json({ asset: newAsset }, { status: 201 });
  } catch (error) {
    console.error("Error creating asset:", error);
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }
}
