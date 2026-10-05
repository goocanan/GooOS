import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and } from "drizzle-orm";

// ─── PATCH /api/workspaces/[slug]/brands/[brandId] ──────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; brandId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, brandId } = await params;

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

    const [brand] = await db
      .select()
      .from(schema.brands)
      .where(and(eq(schema.brands.id, brandId), eq(schema.brands.workspaceId, workspace.id)))
      .limit(1);

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    const allowedFields = [
      "name",
      "description",
      "logoUrl",
      "website",
      "instagram",
      "tiktok",
      "youtube",
      "facebook",
      "primaryColor",
      "secondaryColor",
      "font",
      "toneOfVoice",
      "targetAudience",
      "industry",
      "keywords",
      "guidelines",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(schema.brands)
      .set(updates)
      .where(eq(schema.brands.id, brandId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Failed to update brand" }, { status: 500 });
    }

    return NextResponse.json({ brand: updated });
  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json({ error: "Failed to update brand" }, { status: 500 });
  }
}

// ─── DELETE /api/workspaces/[slug]/brands/[brandId] ────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; brandId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, brandId } = await params;

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

    if (!member || member.role !== "owner") {
      return NextResponse.json(
        { error: "Only workspace owners can delete brands" },
        { status: 403 }
      );
    }

    const [deleted] = await db
      .delete(schema.brands)
      .where(and(eq(schema.brands.id, brandId), eq(schema.brands.workspaceId, workspace.id)))
      .returning({ id: schema.brands.id });

    if (!deleted) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error("Error deleting brand:", error);
    return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 });
  }
}
