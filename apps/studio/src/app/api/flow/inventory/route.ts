import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const material = searchParams.get("material");

    let query = db
      .select()
      .from(schema.flowInventory)
      .orderBy(desc(schema.flowInventory.updatedAt));

    const items = await query;

    let filtered = items;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.sku.toLowerCase().includes(s) ||
          i.brand.toLowerCase().includes(s) ||
          i.color.toLowerCase().includes(s)
      );
    }
    if (material && material !== "all") {
      filtered = filtered.filter((i) => i.materialType.toLowerCase() === material.toLowerCase());
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
  try {
    const body = await req.json();

    if (!body.brand || !body.materialType || !body.color) {
      return NextResponse.json(
        { success: false, error: "Brand, jenis material, dan nama warna wajib diisi" },
        { status: 400 }
      );
    }

    const ws = await db
      .select({ id: schema.workspaces.id })
      .from(schema.workspaces)
      .limit(1);
    const workspaceId = body.workspaceId || ws[0]?.id || "ws_3817e3eb6c344c4da519";
    const userId = body.userId || "fl198gkgaDmA4tQHSject4zcUNf3THbx";

    const newId = body.id || crypto.randomUUID();
    const purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : new Date();
    const initialWeight = Number(body.initialWeight) || 1000;
    const currentWeight = body.currentWeight !== undefined ? Number(body.currentWeight) : initialWeight;
    const totalPrice = Number(body.price) || 0;
    const pricePerGram = initialWeight > 0 ? totalPrice / initialWeight : 0;

    // Generate SKU if not provided
    const brandPrefix = body.brand.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "FIL";
    const matPrefix = body.materialType.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "MAT";
    const colorPrefix = body.color.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "CLR";
    const randNum = Math.floor(100 + Math.random() * 900);
    const sku = body.sku || `${brandPrefix}-${matPrefix}-${colorPrefix}-${randNum}`;

    // Auto-sync into flowTransactions (Buku Kas & Transaksi)
    let txId: string | null = null;
    const syncTransaction = body.syncTransaction !== false;

    if (syncTransaction && totalPrice > 0) {
      txId = crypto.randomUUID();
      await db.insert(schema.flowTransactions).values({
        id: txId,
        workspaceId,
        userId,
        description: `${body.brand} ${body.materialType} ${body.color}`,
        category: "filament",
        type: "expense",
        amount: totalPrice,
        quantity: Number(body.quantity) || 1,
        date: purchaseDate,
        inventoryId: newId,
        materialType: body.materialType,
        colorHex: body.colorHex || null,
        productLink: body.productLink || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const [created] = await db
      .insert(schema.flowInventory)
      .values({
        id: newId,
        workspaceId,
        userId,
        sku,
        brand: body.brand,
        type: body.type || body.materialType,
        version: body.version || null,
        materialType: body.materialType,
        color: body.color,
        colorHex: body.colorHex || null,
        currentWeight,
        initialWeight,
        pricePerGram,
        imageUrl: body.imageUrl || null,
        productLink: body.productLink || null,
        lowStockThreshold: Number(body.lowStockThreshold) || 100,
        purchaseDate,
        transactionId: txId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Also record initial inventory transaction
    await db.insert(schema.flowInventoryTransactions).values({
      id: crypto.randomUUID(),
      workspaceId,
      inventoryId: newId,
      transactionType: "purchase",
      weightChange: currentWeight,
      notes: "Stok awal spul baru",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: created,
      transactionId: txId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
