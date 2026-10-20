import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
    const body = await req.json();

    const batchOrders = await db
      .select()
      .from(schema.flowOrders)
      .where(eq(schema.flowOrders.batchId, batchId));

    if (batchOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: "Batch tidak ditemukan" },
        { status: 404 }
      );
    }

    const newStatus = body.status;
    if (newStatus) {
      await db
        .update(schema.flowOrders)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(schema.flowOrders.batchId, batchId));

      // Jika batch diselesaikan, catat transaksi pemasukan sekali untuk seluruh batch
      if (newStatus === "completed") {
        const batchPrice = batchOrders.reduce((sum, o) => sum + (o.price || 0), 0);
        const totalIncome =
          body.totalIncome !== undefined ? Number(body.totalIncome) : batchPrice;

        const firstOrder = batchOrders[0];
        if (firstOrder) {
          await db.insert(schema.flowTransactions).values({
            id: crypto.randomUUID(),
            workspaceId: firstOrder.workspaceId,
            userId: firstOrder.userId,
            type: "income",
            category: firstOrder.source || "direct",
            description: `Income from Batch ${batchId} (${batchOrders.length} models - ${firstOrder.clientName})`,
            amount: Math.ceil(totalIncome),
            date: new Date(),
            batchId: batchId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Status batch ${batchId} berhasil diperbarui`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
