import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and } from "drizzle-orm";

type GenerationType = "idea" | "caption" | "script" | "repurpose" | "score";

interface GenerationRequest {
  type: GenerationType;
  contentId?: string;
  brandId?: string;
  prompt?: string;
  platform?: string;
  tone?: string;
  maxLength?: number;
}

// Mock AI responses — replace with real LLM API (Claude, OpenAI, etc.)
async function generateContent(
  type: GenerationType,
  input: Record<string, any>
): Promise<{ output: string; tokensUsed: number }> {
  const { prompt, platform, tone, maxLength } = input;

  // Simulated responses
  const responses: Record<GenerationType, string> = {
    idea: `Content Idea: Create a behind-the-scenes video showing your production process. This humanizes your brand and builds connection with your audience. ${prompt ? `Based on: "${prompt}"` : ""}`,
    caption: `📸 Just dropped something amazing! Swipe up to see what we've been working on. ${tone ? `(Tone: ${tone})` : ""} #content #creative`,
    script: `[HOOK - 0:00-0:02]\n"Stop scrolling! What if I told you..."\n\n[BODY - 0:02-0:15]\nExplain the main benefit here.\n\n[CTA - 0:15-0:18]\n"Click the link in bio to learn more!"`,
    repurpose: `This content can be repurposed as:\n1. 📰 Blog post (800 words)\n2. 🎬 TikTok series (5 parts)\n3. 📊 Instagram carousel (6 slides)\n4. 📹 YouTube Short\n5. 📧 Email newsletter feature`,
    score: `Content Score: 8.2/10\n✅ High engagement potential\n⚠️ Consider adding CTA\n💡 Best timing: Tuesday 2-4 PM`,
  };

  return {
    output: responses[type],
    tokensUsed: Math.floor(Math.random() * 500) + 100,
  };
}

// ─── POST /api/workspaces/[slug]/ai/generate ─────────────────
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

    const body: GenerationRequest = await request.json();
    const { type, contentId, brandId, prompt, platform, tone, maxLength } = body;

    if (!type || !["idea", "caption", "script", "repurpose", "score"].includes(type)) {
      return NextResponse.json({ error: "Invalid generation type" }, { status: 400 });
    }

    // Validate content ownership if contentId provided
    if (contentId) {
      const [content] = await db
        .select()
        .from(schema.content)
        .where(and(eq(schema.content.id, contentId), eq(schema.content.workspaceId, workspace.id)))
        .limit(1);

      if (!content) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 });
      }
    }

    // Validate brand ownership if brandId provided
    if (brandId) {
      const [brand] = await db
        .select()
        .from(schema.brands)
        .where(and(eq(schema.brands.id, brandId), eq(schema.brands.workspaceId, workspace.id)))
        .limit(1);

      if (!brand) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 });
      }
    }

    // Generate content (mock for now)
    const { output, tokensUsed } = await generateContent(type, {
      prompt,
      platform,
      tone,
      maxLength,
    });

    // Save to database
    const [generation] = await db
      .insert(schema.aiGenerations)
      .values({
        workspaceId: workspace.id,
        userId: session.user.id,
        type,
        input: { prompt, platform, tone, maxLength, brandId, contentId },
        output: { text: output },
        model: "mock-gpt",
        tokensUsed,
        contentId: contentId || null,
      })
      .returning();

    if (!generation) {
      return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
    }

    // Log activity
    await db.insert(schema.activityLogs).values({
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "ai_generation",
      entity: "content",
      entityId: contentId || null,
      metadata: { type, tokensUsed },
    });

    return NextResponse.json({ generation }, { status: 201 });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}

// ─── GET /api/workspaces/[slug]/ai/generations ────────────────
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as GenerationType | null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    let query = db
      .select()
      .from(schema.aiGenerations)
      .where(eq(schema.aiGenerations.workspaceId, workspace.id));

    if (type) {
      query = db
        .select()
        .from(schema.aiGenerations)
        .where(
          and(
            eq(schema.aiGenerations.workspaceId, workspace.id),
            eq(schema.aiGenerations.type, type)
          )
        );
    }

    const generations = await query.limit(limit);

    return NextResponse.json({ generations });
  } catch (error) {
    console.error("Error fetching generations:", error);
    return NextResponse.json({ error: "Failed to fetch generations" }, { status: 500 });
  }
}
