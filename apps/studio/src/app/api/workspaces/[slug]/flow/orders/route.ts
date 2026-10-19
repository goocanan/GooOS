import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const orders = await db
      .select()
      .from(schema.flowOrders)
      .orderBy(desc(schema.flowOrders.createdAt));

    return NextResponse.json({
      success: true,
      data: orders,
      total: orders.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
