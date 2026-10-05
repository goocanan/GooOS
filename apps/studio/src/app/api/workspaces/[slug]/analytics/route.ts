import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { auth } from "@gooos/auth";
import { eq, and, gte, sql, count } from "drizzle-orm";

// ─── GET /api/workspaces/[slug]/analytics ─────────────────────
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
    const range = searchParams.get("range") || "30d";
    const platform = searchParams.get("platform");

    const now = new Date();
    const startDate = new Date();
    if (range === "7d") startDate.setDate(now.getDate() - 7);
    else if (range === "90d") startDate.setDate(now.getDate() - 90);
    else startDate.setDate(now.getDate() - 30);

    // Aggregate content metrics
    const contentStats = await db
      .select({
        total: count(schema.content.id),
        published: sql<number>`sum(case when ${schema.content.status} = 'published' then 1 else 0 end)`,
        inReview: sql<number>`sum(case when ${schema.content.status} = 'in_review' then 1 else 0 end)`,
        approved: sql<number>`sum(case when ${schema.content.status} = 'approved' then 1 else 0 end)`,
        draft: sql<number>`sum(case when ${schema.content.status} = 'draft' then 1 else 0 end)`,
        idea: sql<number>`sum(case when ${schema.content.status} = 'idea' then 1 else 0 end)`,
      })
      .from(schema.content)
      .where(eq(schema.content.workspaceId, workspace.id));

    // Content type distribution
    const typeStats = await db
      .select({
        type: schema.content.type,
        count: count(schema.content.id),
      })
      .from(schema.content)
      .where(eq(schema.content.workspaceId, workspace.id))
      .groupBy(schema.content.type);

    // Analytics aggregates from analytics table (per-platform metrics)
    const analyticsRows = await db
      .select({
        platform: schema.analytics.platform,
        totalViews: sql<number>`coalesce(sum(${schema.analytics.views}), 0)`,
        totalLikes: sql<number>`coalesce(sum(${schema.analytics.likes}), 0)`,
        totalComments: sql<number>`coalesce(sum(${schema.analytics.comments}), 0)`,
        totalShares: sql<number>`coalesce(sum(${schema.analytics.shares}), 0)`,
        totalSaves: sql<number>`coalesce(sum(${schema.analytics.saves}), 0)`,
        avgCtr: sql<number>`coalesce(avg(${schema.analytics.ctr}), 0)`,
        avgEngagement: sql<number>`coalesce(avg(${schema.analytics.engagementRate}), 0)`,
        followersGained: sql<number>`coalesce(sum(${schema.analytics.followersGained}), 0)`,
      })
      .from(schema.analytics)
      .innerJoin(schema.content, eq(schema.analytics.contentId, schema.content.id))
      .where(
        and(
          eq(schema.content.workspaceId, workspace.id),
          gte(schema.analytics.date, startDate)
        )
      )
      .groupBy(schema.analytics.platform);

    // Overall totals
    const totals = analyticsRows.reduce(
      (acc, row) => {
        acc.views += Number(row.totalViews);
        acc.likes += Number(row.totalLikes);
        acc.comments += Number(row.totalComments);
        acc.shares += Number(row.totalShares);
        acc.saves += Number(row.totalSaves);
        acc.followersGained += Number(row.followersGained);
        return acc;
      },
      { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, followersGained: 0 }
    );

    // Approval stats
    const approvalStats = await db
      .select({
        total: count(schema.approvals.id),
        approved: sql<number>`sum(case when ${schema.approvals.status} = 'approved' then 1 else 0 end)`,
        rejected: sql<number>`sum(case when ${schema.approvals.status} = 'rejected' then 1 else 0 end)`,
        pending: sql<number>`sum(case when ${schema.approvals.status} = 'pending' then 1 else 0 end)`,
        changesRequested: sql<number>`sum(case when ${schema.approvals.status} = 'changes_requested' then 1 else 0 end)`,
      })
      .from(schema.approvals)
      .innerJoin(schema.content, eq(schema.approvals.contentId, schema.content.id))
      .where(eq(schema.content.workspaceId, workspace.id));

    // Member activity count (last 30 days)
    const memberActivity = await db
      .select({
        userName: schema.users.name,
        actionCount: count(schema.activityLogs.id),
      })
      .from(schema.activityLogs)
      .leftJoin(schema.users, eq(schema.activityLogs.userId, schema.users.id))
      .where(
        and(
          eq(schema.activityLogs.workspaceId, workspace.id),
          gte(schema.activityLogs.createdAt, startDate)
        )
      )
      .groupBy(schema.users.name)
      .orderBy(sql`count(${schema.activityLogs.id}) desc`)
      .limit(10);

    // Brand count
    const brandCount = await db
      .select({ count: count(schema.brands.id) })
      .from(schema.brands)
      .where(eq(schema.brands.workspaceId, workspace.id));

    // Asset count
    const assetCount = await db
      .select({ count: count(schema.assets.id) })
      .from(schema.assets)
      .where(eq(schema.assets.workspaceId, workspace.id));

    // AI generations count
    const aiCount = await db
      .select({
        count: count(schema.aiGenerations.id),
        tokens: sql<number>`coalesce(sum(${schema.aiGenerations.tokensUsed}), 0)`,
      })
      .from(schema.aiGenerations)
      .where(eq(schema.aiGenerations.workspaceId, workspace.id));

    return NextResponse.json({
      range,
      contentStats: contentStats[0] || { total: 0, published: 0, inReview: 0, approved: 0, draft: 0, idea: 0 },
      typeStats,
      platformMetrics: analyticsRows,
      totals,
      approvalStats: approvalStats[0] || { total: 0, approved: 0, rejected: 0, pending: 0, changesRequested: 0 },
      memberActivity,
      brandCount: brandCount[0]?.count || 0,
      assetCount: assetCount[0]?.count || 0,
      aiGenerations: aiCount[0]?.count || 0,
      aiTokensUsed: aiCount[0]?.tokens || 0,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
