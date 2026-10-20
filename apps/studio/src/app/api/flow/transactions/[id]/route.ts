import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = await db
      .select()
      .from(schema.flowTransactions)
      .where(eq(schema.flowTransactions.id, id))
      .limit(1);

    const tx = rows[0];
    if (!tx) {
      return NextResponse.json(
        { success: false, error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tx,
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

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.amount !== undefined) updateData.amount = Number(body.amount);
    if (body.quantity !== undefined) updateData.quantity = Number(body.quantity);
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.colorHex !== undefined) updateData.colorHex = body.colorHex;
    if (body.materialType !== undefined) updateData.materialType = body.materialType;
    if (body.productLink !== undefined) updateData.productLink = body.productLink;
    if (body.size !== undefined) updateData.size = body.size;

    const [updated] = await db
      .update(schema.flowTransactions)
      .set(updateData)
      .where(eq(schema.flowTransactions.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
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

    const [deleted] = await db
      .delete(schema.flowTransactions)
      .where(eq(schema.flowTransactions.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Transaksi tidak ditemukan atau sudah dihapus" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
