import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const orders = await db
      .select()
      .from(schema.flowOrders)
      .orderBy(desc(schema.flowOrders.createdAt));

    const items = await db.select().from(schema.flowOrderItems);
    const itemsByOrder = new Map<string, typeof items>();
    for (const item of items) {
      if (!itemsByOrder.has(item.orderId)) {
        itemsByOrder.set(item.orderId, []);
      }
      itemsByOrder.get(item.orderId)!.push(item);
    }

    let result = orders.map((o) => ({
      ...o,
      items: itemsByOrder.get(o.id) || [],
    }));

    if (status && status !== "all") {
      result = result.filter((o) => o.status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(s) ||
          (o.clientName && o.clientName.toLowerCase().includes(s)) ||
          (o.modelName && o.modelName.toLowerCase().includes(s))
      );
    }

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
