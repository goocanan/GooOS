import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, desc, and, like, or } from "drizzle-orm";

// ─── Type guards ──────────────────────────────────────────────

function isValidContentStatus(val: unknown): val is ContentStatus {
  return [
    "idea",
    "planned",
    "script",
    "production",
    "editing",
    "review",
    "approved",
    "scheduled",
    "published",
    "archived",
  ].includes(val as string);
}

function isValidContentType(val: unknown): val is ContentType {
  return [
    "tiktok",
    "instagram_post",
    "instagram_reel",
    "instagram_story",
    "youtube_video",
    "youtube_short",
    "facebook_post",
    "facebook_reel",
    "x_twitter",
    "linkedin",
    "blog",
    "advertisement",
  ].includes(val as string);
}

function isValidPriority(val: unknown): val is Priority {
  return ["low", "medium", "high", "urgent"].includes(val as string);
}

type ContentStatus =
  | "idea"
  | "planned"
  | "script"
  | "production"
  | "editing"
  | "review"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

type ContentType =
  | "tiktok"
  | "instagram_post"
  | "instagram_reel"
  | "instagram_story"
  | "youtube_video"
  | "youtube_short"
  | "facebook_post"
  | "facebook_reel"
  | "x_twitter"
  | "linkedin"
  | "blog"
  | "advertisement";

type Priority = "low" | "medium" | "high" | "urgent";

// ─── GET /api/workspaces/[slug]/content ──────────────────────────
// List all content in a workspace with filters & pagination

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Find workspace by slug
    const [workspace] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.slug, slug))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check membership
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
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const priority = searchParams.get("priority");

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(schema.content.workspaceId, workspace.id)];

    if (status && isValidContentStatus(status)) {
      conditions.push(eq(schema.content.status, status));
    }
    if (type && isValidContentType(type)) {
      conditions.push(eq(schema.content.type, type as any));
    }
    if (priority && isValidPriority(priority)) {
      conditions.push(eq(schema.content.priority, priority as any));
    }
    if (search) {
      conditions.push(
        or(
          like(schema.content.title, `%${search}%`),
          like(schema.content.description ?? "", `%${search}%`)
        )!
      );
    }

    // Fetch content
    const items = await db
      .select({
        id: schema.content.id,
        title: schema.content.title,
        description: schema.content.description,
        type: schema.content.type,
        status: schema.content.status,
        priority: schema.content.priority,
        tags: schema.content.tags,
        deadline: schema.content.deadline,
        scheduledAt: schema.content.scheduledAt,
        publishedAt: schema.content.publishedAt,
        createdAt: schema.content.createdAt,
        updatedAt: schema.content.updatedAt,
        brandName: schema.brands.name,
      })
      .from(schema.content)
      .leftJoin(schema.brands, eq(schema.content.brandId, schema.brands.id))
      .where(and(...conditions))
      .orderBy(desc(schema.content.updatedAt))
      .limit(limit)
      .offset(offset);

    // Count total
    const countResult = await db
      .select({ count: schema.content.id })
      .from(schema.content)
      .where(and(...conditions));

    const totalCount = countResult.length > 0 ? Number(countResult[0]?.count ?? 0) : 0;

    return NextResponse.json({
      content: items,
      pagination: {
        page,
        limit,
        total: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// ─── POST /api/workspaces/[slug]/content ─────────────────────────
// Create new content item

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Find workspace
    const [workspace] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.slug, slug))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check membership
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
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, type, status, priority, tags, deadline, brandId } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      );
    }

    const [newContent] = await db
      .insert(schema.content)
      .values({
        workspaceId: workspace.id,
        title,
        description: description ?? null,
        type,
        status: status ?? "idea",
        priority: priority ?? "medium",
        tags: tags ?? [],
        deadline: deadline ? new Date(deadline) : null,
        brandId: brandId ?? null,
        ownerId: session.user.id,
        creatorId: session.user.id,
      })
      .returning();

    if (!newContent) {
      return NextResponse.json(
        { error: "Failed to create content" },
        { status: 500 }
      );
    }

    return NextResponse.json({ content: newContent }, { status: 201 });
  } catch (error) {
    console.error("Error creating content:", error);
    return NextResponse.json(
      { error: "Failed to create content" },
      { status: 500 }
    );
  }
}
