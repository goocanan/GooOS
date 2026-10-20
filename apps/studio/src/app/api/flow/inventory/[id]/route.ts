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
      .from(schema.flowInventory)
      .where(eq(schema.flowInventory.id, id))
      .limit(1);

    const item = rows[0];
    if (!item) {
      return NextResponse.json(
        { success: false, error: "Spul filamen tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
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

    if (body.brand !== undefined) updateData.brand = body.brand;
    if (body.materialType !== undefined) updateData.materialType = body.materialType;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.colorHex !== undefined) updateData.colorHex = body.colorHex;
    if (body.currentWeight !== undefined) updateData.currentWeight = Number(body.currentWeight);
    if (body.initialWeight !== undefined) updateData.initialWeight = Number(body.initialWeight);
    if (body.pricePerGram !== undefined) updateData.pricePerGram = Number(body.pricePerGram);
    if (body.lowStockThreshold !== undefined) updateData.lowStockThreshold = Number(body.lowStockThreshold);
    if (body.productLink !== undefined) updateData.productLink = body.productLink;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.purchaseDate !== undefined) {
      updateData.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
    }

    const [updated] = await db
      .update(schema.flowInventory)
      .set(updateData)
      .where(eq(schema.flowInventory.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Spul filamen tidak ditemukan" },
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
      .delete(schema.flowInventory)
      .where(eq(schema.flowInventory.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Spul filamen tidak ditemukan" },
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
