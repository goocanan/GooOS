import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const [spools, printers, orders, txs, products] = await Promise.all([
      db.select().from(schema.flowInventory),
      db.select().from(schema.flowPrinters),
      db.select().from(schema.flowOrders),
      db.select().from(schema.flowTransactions),
      db.select().from(schema.flowProducts),
    ]);

    // Spool stats
    const totalWeightKg = spools.reduce((acc, s) => acc + (s.currentWeight || 0), 0) / 1000;
    const totalInventoryValue = spools.reduce(
      (acc, s) => acc + (s.currentWeight || 0) * (s.pricePerGram || 0),
      0
    );
    const lowStockSpools = spools.filter(
      (s) => s.currentWeight <= (s.lowStockThreshold || 100) && s.currentWeight > 0
    );
    const emptySpools = spools.filter((s) => s.currentWeight <= 0);

    // Printer stats
    const onlinePrinters = printers.filter((p) => p.status !== "offline");
    const printingPrinters = printers.filter((p) => p.status === "printing");

    // Order stats
    const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "queued");
    const inProgressOrders = orders.filter((o) => o.status === "printing");
    const completedOrders = orders.filter((o) => o.status === "completed" || o.status === "shipped");

    // Finance stats from 474 transactions
    const totalIncome = txs
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalExpense = txs
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const netProfit = totalIncome - totalExpense;

    return NextResponse.json({
      success: true,
      data: {
        inventory: {
          totalSpools: spools.length,
          totalWeightKg: Number(totalWeightKg.toFixed(2)),
          totalValue: Math.round(totalInventoryValue),
          lowStockCount: lowStockSpools.length,
          emptyCount: emptySpools.length,
          lowStockList: lowStockSpools.slice(0, 5),
        },
        printers: {
          total: printers.length,
          online: onlinePrinters.length,
          printing: printingPrinters.length,
        },
        orders: {
          total: orders.length,
          pending: pendingOrders.length,
          inProgress: inProgressOrders.length,
          completed: completedOrders.length,
          recent: orders.slice(0, 5),
        },
        finance: {
          totalIncome: Math.round(totalIncome),
          totalExpense: Math.round(totalExpense),
          netProfit: Math.round(netProfit),
        },
        productsCount: products.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
