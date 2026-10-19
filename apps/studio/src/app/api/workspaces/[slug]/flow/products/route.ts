import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc, eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let products = await db
      .select()
      .from(schema.flowProducts)
      .orderBy(desc(schema.flowProducts.updatedAt));

    if (category && category !== "All") {
      products = products.filter((p) => p.category === category);
    }

    if (search) {
      const s = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.sku && p.sku.toLowerCase().includes(s)) ||
          (p.description && p.description.toLowerCase().includes(s))
      );
    }

    return NextResponse.json({
      success: true,
      data: products,
      total: products.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
