import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc, eq } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const printerId = searchParams.get("printerId");
    const partCategory = searchParams.get("partCategory");
    const search = searchParams.get("search");

    const assets = await db
      .select()
      .from(schema.flowAssets)
      .orderBy(desc(schema.flowAssets.updatedAt));

    let filtered = assets;

    if (category && category !== "all") {
      filtered = filtered.filter(
        (a) => a.category && a.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (printerId && printerId !== "all") {
      filtered = filtered.filter((a) => a.printerId === printerId);
    }

    if (partCategory && partCategory !== "all") {
      filtered = filtered.filter(
        (a) => a.partCategory && a.partCategory.toLowerCase() === partCategory.toLowerCase()
      );
    }

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(s) ||
          (a.notes && a.notes.toLowerCase().includes(s)) ||
          (a.type && a.type.toLowerCase().includes(s)) ||
          (a.partCategory && a.partCategory.toLowerCase().includes(s))
      );
    }

    const totalStock = filtered.reduce((acc, a) => acc + (a.quantity || 0), 0);
    const totalAssetValue = filtered.reduce(
      (acc, a) => acc + (a.quantity || 0) * (a.price || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
      summary: {
        totalStock,
        totalAssetValue: Math.round(totalAssetValue),
      },
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

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Nama aset wajib diisi" },
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
    const numPrice = Number(body.price) || 0;
    const numQty = Number(body.quantity) || 1;
    const totalAmount = numPrice * numQty;

    // Determine category mapping for flowTransactions
    let txCategory = "other";
    const rawCat = (body.category || "tool").toLowerCase();
    if (rawCat === "part") {
      txCategory = "parts";
    } else if (rawCat === "tool") {
      txCategory = "tools";
    } else if (rawCat === "packing" || rawCat === "packaging") {
      txCategory = "packaging";
    } else if (rawCat === "production" || rawCat === "production_stuff") {
      txCategory = "production_stuff";
    }

    // Auto-sync into flowTransactions (Buku Kas & Transaksi)
    let txId: string | null = null;
    const syncTransaction = body.syncTransaction !== false;

    if (syncTransaction && totalAmount > 0) {
      txId = crypto.randomUUID();
      await db.insert(schema.flowTransactions).values({
        id: txId,
        workspaceId,
        userId,
        description: body.name + (body.size ? ` (${body.size})` : ""),
        category: txCategory,
        partCategory: body.partCategory || null,
        printerId: body.printerId || null,
        type: "expense",
        amount: totalAmount,
        quantity: numQty,
        date: purchaseDate,
        productLink: body.productLink || null,
        size: body.size || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const [created] = await db
      .insert(schema.flowAssets)
      .values({
        id: newId,
        workspaceId,
        userId,
        name: body.name,
        category: body.category || "tool",
        partCategory: body.partCategory || null,
        printerId: body.printerId || null,
        condition: body.condition || "new",
        quantity: numQty,
        initialQuantity: numQty,
        price: numPrice,
        purchaseDate,
        notes: body.notes || null,
        productLink: body.productLink || null,
        type: body.type || null,
        size: body.size || null,
        transactionId: txId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

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
