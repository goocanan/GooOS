import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let assets = await db
      .select()
      .from(schema.flowAssets)
      .orderBy(desc(schema.flowAssets.updatedAt));

    if (category && category !== "All") {
      assets = assets.filter((a) => a.category === category);
    }

    if (search) {
      const s = search.toLowerCase();
      assets = assets.filter(
        (a) =>
          a.name.toLowerCase().includes(s) ||
          (a.notes && a.notes.toLowerCase().includes(s))
      );
    }

    return NextResponse.json({
      success: true,
      data: assets,
      total: assets.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
