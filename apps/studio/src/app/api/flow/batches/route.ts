import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const batches = await db
      .select()
      .from(schema.flowBatches)
      .orderBy(desc(schema.flowBatches.createdAt));

    const parts = await db.select().from(schema.flowParts);
    const spools = await db.select().from(schema.flowInventory);

    const partsByBatch = new Map<string, typeof parts>();
    for (const part of parts) {
      if (part.batchId) {
        if (!partsByBatch.has(part.batchId)) {
          partsByBatch.set(part.batchId, []);
        }
        partsByBatch.get(part.batchId)!.push(part);
      }
    }

    const spoolMap = new Map(spools.map((s) => [s.id, s]));

    const result = batches.map((b) => {
      const batchParts = partsByBatch.get(b.id) || [];
      const spool = b.spoolId ? spoolMap.get(b.spoolId) : null;
      return {
        ...b,
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
