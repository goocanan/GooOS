import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const assets = await db
      .select()
      .from(schema.flowAssets)
      .orderBy(desc(schema.flowAssets.updatedAt));

    let filtered = assets;
    if (category && category !== "all") {
      filtered = filtered.filter((a) => a.category && a.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(s) ||
          (a.notes && a.notes.toLowerCase().includes(s)) ||
          (a.type && a.type.toLowerCase().includes(s))
      );
    }

    const totalStock = filtered.reduce((acc, a) => acc + (a.quantity || 0), 0);
    const totalAssetValue = filtered.reduce(
      (acc, a) => acc + (a.quantity || 0) * (a.price || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
      summary: {
        totalStock,
        totalAssetValue: Math.round(totalAssetValue),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
