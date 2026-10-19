import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc } from "drizzle-orm";
import crypto from "crypto";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Determine workspaceId & userId
    let workspaceId = body.workspaceId;
    let userId = body.userId;

    if (!workspaceId || !userId) {
      const ref = await db
        .select({ workspaceId: schema.flowOrders.workspaceId, userId: schema.flowOrders.userId })
        .from(schema.flowOrders)
        .limit(1);

      const firstRef = ref[0];
      if (firstRef) {
        workspaceId = workspaceId || firstRef.workspaceId;
        userId = userId || firstRef.userId;
      } else {
        const ws = await db.select({ id: schema.workspaces.id }).from(schema.workspaces).limit(1);
        const firstWs = ws[0];
        workspaceId = workspaceId || firstWs?.id || "ws_3817e3eb6c344c4da519";
        userId = userId || "fl198gkgaDmA4tQHSject4zcUNf3THbx";
      }
    }

    // Auto-generate orderNumber if not provided
    let orderNumber = body.orderNumber ? String(body.orderNumber).trim() : "";
    if (!orderNumber) {
      const allOrders = await db
        .select({ orderNumber: schema.flowOrders.orderNumber })
        .from(schema.flowOrders);
      let maxNum = 1000;
      for (const o of allOrders) {
        const m = o.orderNumber.match(/\d+/);
        if (m?.[0]) {
          const n = parseInt(m[0], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      orderNumber = `#3DF-${maxNum + 1}`;
    }

    const orderId = body.id || `order_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    const newOrder = {
      id: orderId,
      workspaceId,
      userId,
      orderNumber,
      modelName: body.modelName ? String(body.modelName).trim() : "Custom 3D Print",
      clientName: body.clientName ? String(body.clientName).trim() : "Direct Client",
      status: body.status || "pending",
      progress: Number(body.progress || 0),
      price: Number(body.price || 0),
      source: body.source || "direct",
      modelImageUrl: body.modelImageUrl || null,
      materialType: body.materialType || "PLA",
      materialColor: body.materialColor || "Hitam",
      quantity: Number(body.quantity || 1),
      qtyPart: Number(body.qtyPart || 1),
      infill: body.infill ? String(body.infill) : "15%",
      layerHeight: body.layerHeight ? String(body.layerHeight) : "0.20",
      weight: body.weight !== undefined && body.weight !== null ? Number(body.weight) : null,
      time: body.time !== undefined && body.time !== null ? Number(body.time) : null,
      dueDate: body.dueDate ? String(body.dueDate) : null,
      batchId: body.batchId || null,
      errorMessage: body.errorMessage || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.flowOrders).values(newOrder);

    // If items provided
    if (Array.isArray(body.items) && body.items.length > 0) {
      for (const item of body.items) {
        await db.insert(schema.flowOrderItems).values({
          id: `item_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
          orderId: orderId,
          inventoryId: item.inventoryId || null,
          weightUsed: Number(item.weightUsed || 0),
          cost: Number(item.cost || 0),
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: newOrder,
        message: "Pesanan berhasil ditambahkan",
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
