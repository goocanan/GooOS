import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const printers = await db
      .select()
      .from(schema.flowPrinters)
      .orderBy(desc(schema.flowPrinters.updatedAt));

    return NextResponse.json({
      success: true,
      data: printers,
      total: printers.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
