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
      .from(schema.flowProducts)
      .where(eq(schema.flowProducts.id, id))
      .limit(1);

    const product = rows[0];
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
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
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.referenceLink !== undefined) updateData.referenceLink = body.referenceLink;
    if (body.link1 !== undefined) updateData.link1 = body.link1;
    if (body.link2 !== undefined) updateData.link2 = body.link2;
    if (body.modelWeight !== undefined) updateData.modelWeight = Number(body.modelWeight);
    if (body.printingTime !== undefined) updateData.printingTime = Number(body.printingTime);
    if (body.materialCost !== undefined) updateData.materialCost = Number(body.materialCost);
    if (body.energyCost !== undefined) updateData.energyCost = Number(body.energyCost);
    if (body.wearCost !== undefined) updateData.wearCost = Number(body.wearCost);
    if (body.packagingCost !== undefined) updateData.packagingCost = Number(body.packagingCost);
    if (body.taxRate !== undefined) updateData.taxRate = Number(body.taxRate);
    if (body.finalPrice !== undefined) updateData.finalPrice = Number(body.finalPrice);
    if (body.marginPercent !== undefined) updateData.marginPercent = Number(body.marginPercent);
    if (body.manualPrice !== undefined) updateData.manualPrice = body.manualPrice !== null ? Number(body.manualPrice) : null;
    if (body.qtyPart !== undefined) updateData.qtyPart = Number(body.qtyPart);
    if (body.infill !== undefined) updateData.infill = String(body.infill);
    if (body.layerHeight !== undefined) updateData.layerHeight = String(body.layerHeight);
    if (body.selectedMaterialId !== undefined) updateData.selectedMaterialId = body.selectedMaterialId;
    if (body.pricingMode !== undefined) updateData.pricingMode = body.pricingMode;
    if (body.items !== undefined) updateData.items = body.items;
    if (body.options !== undefined) updateData.options = body.options;

    const [updated] = await db
      .update(schema.flowProducts)
      .set(updateData)
      .where(eq(schema.flowProducts.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Produk berhasil diperbarui",
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
      .delete(schema.flowProducts)
      .where(eq(schema.flowProducts.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Produk berhasil dihapus",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
