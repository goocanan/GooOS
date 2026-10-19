import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const projects = await db
      .select()
      .from(schema.flowProjects)
      .orderBy(desc(schema.flowProjects.createdAt));

    const parts = await db.select().from(schema.flowParts);

    // Group parts by project
    const partsByProject = new Map<string, typeof parts>();
    for (const part of parts) {
      if (!partsByProject.has(part.projectId)) {
        partsByProject.set(part.projectId, []);
      }
      partsByProject.get(part.projectId)!.push(part);
    }

    let result = projects.map((proj) => {
      const projParts = partsByProject.get(proj.id) || [];
      const totalWeight = projParts.reduce((acc, p) => acc + (p.weight || 0) * (p.quantity || 1), 0);
      const totalTimeMinutes = projParts.reduce((acc, p) => acc + (p.printDurationMinutes || 0), 0);
      return {
        ...proj,
        parts: projParts,
        partsCount: projParts.length,
        totalWeight,
        totalTimeMinutes,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.notes && p.notes.toLowerCase().includes(s))
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      total: result.length,
      partsTotal: parts.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
