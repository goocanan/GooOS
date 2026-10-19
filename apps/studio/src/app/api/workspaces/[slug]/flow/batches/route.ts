import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const batches = await db
      .select()
      .from(schema.flowBatches)
      .orderBy(desc(schema.flowBatches.createdAt));

    const parts = await db.select().from(schema.flowParts);
    const spools = await db.select().from(schema.flowInventory);
    const spoolsMap = new Map(spools.map((s) => [s.id, s]));

    const result = batches.map((batch) => {
      const batchParts = parts.filter((p) => p.batchId === batch.id);
      const spool = batch.spoolId ? spoolsMap.get(batch.spoolId) : null;
      return {
        ...batch,
        parts: batchParts,
        partsCount: batchParts.length,
        spool,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      total: result.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
