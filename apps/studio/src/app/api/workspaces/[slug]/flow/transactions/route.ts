import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // income, expense, all
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let txs = await db
      .select()
      .from(schema.flowTransactions)
      .orderBy(desc(schema.flowTransactions.date));

    if (type && type !== "all") {
      txs = txs.filter((t) => t.type === type);
    }

    if (category && category !== "all") {
      txs = txs.filter((t) => t.category === category);
    }

    if (search) {
      const s = search.toLowerCase();
      txs = txs.filter(
        (t) =>
          t.description.toLowerCase().includes(s) ||
          (t.category && t.category.toLowerCase().includes(s))
      );
    }

    // Totals
    const totalIncome = txs
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalExpense = txs
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const netProfit = totalIncome - totalExpense;

    return NextResponse.json({
      success: true,
      data: txs,
      total: txs.length,
      summary: {
        totalIncome,
        totalExpense,
        netProfit,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
