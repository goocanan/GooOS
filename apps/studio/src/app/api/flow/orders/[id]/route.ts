import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const orders = await db
      .select()
      .from(schema.flowOrders)
      .where(eq(schema.flowOrders.id, id))
      .limit(1);

    const order = orders[0];
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }
    const items = await db
      .select()
      .from(schema.flowOrderItems)
      .where(eq(schema.flowOrderItems.orderId, id));

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        items,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existingOrders = await db
      .select()
      .from(schema.flowOrders)
      .where(eq(schema.flowOrders.id, id))
      .limit(1);

    const existing = existingOrders[0];
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.status !== undefined) updateData.status = body.status;
    if (body.progress !== undefined) updateData.progress = Number(body.progress);
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.modelName !== undefined) updateData.modelName = body.modelName;
    if (body.clientName !== undefined) updateData.clientName = body.clientName;
    if (body.source !== undefined) updateData.source = body.source;
    if (body.materialType !== undefined) updateData.materialType = body.materialType;
    if (body.materialColor !== undefined) updateData.materialColor = body.materialColor;
    if (body.quantity !== undefined) updateData.quantity = Number(body.quantity);
    if (body.qtyPart !== undefined) updateData.qtyPart = Number(body.qtyPart);
    if (body.infill !== undefined) updateData.infill = String(body.infill);
    if (body.layerHeight !== undefined) updateData.layerHeight = String(body.layerHeight);
    if (body.weight !== undefined) updateData.weight = Number(body.weight);
    if (body.time !== undefined) updateData.time = Number(body.time);
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? String(body.dueDate) : null;
    if (body.modelImageUrl !== undefined) updateData.modelImageUrl = body.modelImageUrl;

    await db
      .update(schema.flowOrders)
      .set(updateData)
      .where(eq(schema.flowOrders.id, id));

    // Otomatis catat transaksi income ke Buku Kas jika status selesai (completed)
    if (body.status === "completed" && existing.status !== "completed") {
      const incomeAmount =
        body.income !== undefined ? Number(body.income) : existing.price;

      await db.insert(schema.flowTransactions).values({
        id: crypto.randomUUID(),
        workspaceId: existing.workspaceId,
        userId: existing.userId,
        type: "income",
        category: existing.source || "direct",
        description: `Income from Order #${existing.orderNumber} (${existing.modelName})`,
        amount: Math.ceil(incomeAmount),
        date: new Date(),
        orderId: existing.id,
        batchId: existing.batchId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const updated = await db
      .select()
      .from(schema.flowOrders)
      .where(eq(schema.flowOrders.id, id))
      .limit(1);

    const firstUpdated = updated[0];
    return NextResponse.json({
      success: true,
      data: firstUpdated || null,
      message: "Pesanan berhasil diperbarui",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete linked items first
    await db
      .delete(schema.flowOrderItems)
      .where(eq(schema.flowOrderItems.orderId, id));

    // Delete the order
    await db
      .delete(schema.flowOrders)
      .where(eq(schema.flowOrders.id, id));

    return NextResponse.json({
      success: true,
      message: "Pesanan berhasil dihapus",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
