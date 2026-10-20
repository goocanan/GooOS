import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc, eq } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // income | expense | all
    const category = searchParams.get("category");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : null;

    let query = db
      .select()
      .from(schema.flowTransactions)
      .orderBy(desc(schema.flowTransactions.date));

    const allTx = await query;

    let filtered = allTx;
    if (type && type !== "all") {
      filtered = filtered.filter((t) => t.type === type);
    }
    if (category && category !== "all") {
      filtered = filtered.filter(
        (t) => t.category && t.category.toLowerCase() === category.toLowerCase()
      );
    }

    const totalIncome = allTx
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalExpense = allTx
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const resultData = limit ? filtered.slice(0, limit) : filtered;

    return NextResponse.json({
      success: true,
      data: resultData,
      total: filtered.length,
      summary: {
        totalIncome: Math.round(totalIncome),
        totalExpense: Math.round(totalExpense),
        netProfit: Math.round(totalIncome - totalExpense),
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

    if (!body.description || body.amount === undefined) {
      return NextResponse.json(
        { success: false, error: "Deskripsi dan jumlah nominal wajib diisi" },
        { status: 400 }
      );
    }

    // Determine workspaceId & userId
    let workspaceId = body.workspaceId;
    let userId = body.userId;

    if (!workspaceId || !userId) {
      const ref = await db
        .select({
          workspaceId: schema.flowTransactions.workspaceId,
          userId: schema.flowTransactions.userId,
        })
        .from(schema.flowTransactions)
        .limit(1);

      const firstRef = ref[0];
      if (firstRef) {
        workspaceId = workspaceId || firstRef.workspaceId;
        userId = userId || firstRef.userId;
      } else {
        const ws = await db
          .select({ id: schema.workspaces.id })
          .from(schema.workspaces)
          .limit(1);
        const firstWs = ws[0];
        workspaceId = workspaceId || firstWs?.id || "ws_3817e3eb6c344c4da519";
        userId = userId || "fl198gkgaDmA4tQHSject4zcUNf3THbx";
      }
    }

    const txType =
      body.transactionType === "restock"
        ? "expense"
        : body.type || body.transactionType || "expense";

    const newTxId = body.id || crypto.randomUUID();
    const dateVal = body.date ? new Date(body.date) : new Date();
    const numAmount = Number(body.amount) || 0;
    const numQty = Number(body.quantity) || 1;

    const [created] = await db
      .insert(schema.flowTransactions)
      .values({
        id: newTxId,
        workspaceId,
        userId,
        description: body.description,
        category: body.category || "other",
        partCategory: body.partCategory || null,
        printerId: body.printerId || null,
        type: txType,
        amount: numAmount,
        quantity: numQty,
        date: dateVal,
        orderId: body.orderId || null,
        inventoryId: body.inventoryId || null,
        batchId: body.batchId || null,
        productLink: body.productLink || null,
        colorHex: body.colorHex || null,
        materialType: body.materialType || null,
        size: body.size || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Auto-sync into flowAssets if category is parts or tools
    if (txType === "expense") {
      const unitPrice = numQty > 0 ? numAmount / numQty : numAmount;
      if (body.category === "parts") {
        await db.insert(schema.flowAssets).values({
          id: crypto.randomUUID(),
          workspaceId,
          userId,
          name: body.description,
          category: "part",
          partCategory: body.partCategory || "other",
          printerId: body.printerId || null,
          condition: body.condition || "new",
          quantity: numQty,
          initialQuantity: numQty,
          price: unitPrice,
          purchaseDate: dateVal,
          productLink: body.productLink || null,
          notes: `Dari transaksi: ${body.description}`,
          transactionId: newTxId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else if (body.category === "tools") {
        await db.insert(schema.flowAssets).values({
          id: crypto.randomUUID(),
          workspaceId,
          userId,
          name: body.description,
          category: "tool",
          condition: "new",
          quantity: numQty,
          initialQuantity: numQty,
          price: unitPrice,
          purchaseDate: dateVal,
          productLink: body.productLink || null,
          notes: `Dari transaksi: ${body.description}`,
          transactionId: newTxId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

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
