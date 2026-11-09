import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc } from "drizzle-orm";
import crypto from "crypto";
import { blockIfDemo } from "@/lib/demo-guard";
import { getUserAccess } from "@/lib/access-guard";
import { generateRandomProductSku } from "@/lib/product-sku";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const products = await db
      .select()
      .from(schema.flowProducts)
      .orderBy(desc(schema.flowProducts.updatedAt));

    let filtered = products;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.sku && p.sku.toLowerCase().includes(s)) ||
          (p.description && p.description.toLowerCase().includes(s))
      );
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const demoBlock = await blockIfDemo(req, undefined, "create");
  if (demoBlock) return demoBlock;

  try {
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Nama produk wajib diisi" },
        { status: 400 }
      );
    }

    // Determine workspaceId & userId based on session
    const access = await getUserAccess(req);
    let workspaceId = body.workspaceId || "ws_3817e3eb6c344c4da519";
    let userId = access.userId || body.userId;

    if (!userId) {
      const ref = await db
        .select({
          userId: schema.flowProducts.userId,
        })
        .from(schema.flowProducts)
        .limit(1);

      userId = ref[0]?.userId || "fl198gkgaDmA4tQHSject4zcUNf3THbx";
    }

    const newId = body.id || crypto.randomUUID();

    const resolvedSku = body.sku && String(body.sku).trim()
      ? String(body.sku).trim().toUpperCase()
      : generateRandomProductSku();

    const [created] = await db
      .insert(schema.flowProducts)
      .values({
        id: newId,
        workspaceId,
        userId,
        name: body.name,
        sku: resolvedSku,
        imageUrl: body.imageUrl || null,
        modelWeight: Number(body.modelWeight) || 0,
        printingTime: Number(body.printingTime) || 0,
        materialCost: Number(body.materialCost) || 0,
        energyCost: Number(body.energyCost) || 0,
        wearCost: Number(body.wearCost) || 0,
        packagingCost: Number(body.packagingCost) || 0,
        taxRate: Number(body.taxRate) || 0,
        finalPrice: Number(body.finalPrice) || 0,
        link1: body.link1 || null,
        link2: body.link2 || null,
        marginPercent: Number(body.marginPercent) || 60,
        manualPrice: body.manualPrice !== undefined && body.manualPrice !== null ? Number(body.manualPrice) : null,
        notes: body.notes || null,
        description: body.description || null,
        referenceLink: body.referenceLink || null,
        selectedMaterialId: body.selectedMaterialId || null,
        qtyPart: Number(body.qtyPart) || 1,
        infill: body.infill ? String(body.infill) : "15",
        layerHeight: body.layerHeight ? String(body.layerHeight) : "0.20",
        category: body.category || "General",
        pricingMode: body.pricingMode || "total_modal",
        items: body.items || [],
        options: body.options || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: created,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
