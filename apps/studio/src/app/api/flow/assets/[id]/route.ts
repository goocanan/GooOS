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
      .from(schema.flowAssets)
      .where(eq(schema.flowAssets.id, id))
      .limit(1);

    const asset = rows[0];
    if (!asset) {
      return NextResponse.json(
        { success: false, error: "Aset tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: asset,
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

    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.partCategory !== undefined) updateData.partCategory = body.partCategory;
    if (body.printerId !== undefined) updateData.printerId = body.printerId;
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.quantity !== undefined) updateData.quantity = Number(body.quantity);
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.purchaseDate !== undefined) updateData.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.productLink !== undefined) updateData.productLink = body.productLink;
    if (body.size !== undefined) updateData.size = body.size;

    const [updated] = await db
      .update(schema.flowAssets)
      .set(updateData)
      .where(eq(schema.flowAssets.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Aset tidak ditemukan" },
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
      .delete(schema.flowAssets)
      .where(eq(schema.flowAssets.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Aset tidak ditemukan" },
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
