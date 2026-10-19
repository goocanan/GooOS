import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const material = searchParams.get("material");

    let query = db
      .select()
      .from(schema.flowInventory)
      .orderBy(desc(schema.flowInventory.updatedAt));

    const items = await query;

    let filtered = items;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.sku.toLowerCase().includes(s) ||
          i.brand.toLowerCase().includes(s) ||
          i.color.toLowerCase().includes(s)
      );
    }
    if (material && material !== "all") {
      filtered = filtered.filter((i) => i.materialType.toLowerCase() === material.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
