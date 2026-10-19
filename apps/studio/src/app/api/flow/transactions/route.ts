import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // income | expense | all
    const category = searchParams.get("category");
    const limit = Number(searchParams.get("limit")) || 200;

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
      filtered = filtered.filter((t) => t.category && t.category.toLowerCase() === category.toLowerCase());
    }

    const totalIncome = allTx
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalExpense = allTx
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: filtered.slice(0, limit),
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
