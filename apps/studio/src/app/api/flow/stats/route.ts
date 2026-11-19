import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { eq } from "drizzle-orm";
import { getUserAccess, isAnonymous } from "@/lib/access-guard";
import { getDemoStats } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const access = await getUserAccess(req);
    if (access.isDemo) {
      return NextResponse.json({
        success: true,
        data: getDemoStats(),
      });
    }

    // Jika belum login (tanpa akun / anonim) -> kembalikan angka statistik 0
    if (isAnonymous(access)) {
      return NextResponse.json({
        success: true,
        data: {
          inventory: {
            totalSpools: 0,
            totalWeightKg: 0,
            totalValue: 0,
            lowStockCount: 0,
            emptyCount: 0,
            lowStockList: [],
          },
          printers: {
            total: 0,
            online: 0,
            printing: 0,
          },
          orders: {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0,
            recent: [],
          },
          finance: {
            totalIncome: 0,
            totalExpense: 0,
            netProfit: 0,
          },
          productsCount: 0,
        },
      });
    }

    const [spools, printers, orders, txs, products] = await Promise.all([
      access.isOwner
        ? db.select().from(schema.flowInventory)
        : db.select().from(schema.flowInventory).where(eq(schema.flowInventory.userId, access.userId!)),
      access.isOwner
        ? db.select().from(schema.flowPrinters)
        : db.select().from(schema.flowPrinters).where(eq(schema.flowPrinters.userId, access.userId!)),
      access.isOwner
        ? db.select().from(schema.flowOrders)
        : db.select().from(schema.flowOrders).where(eq(schema.flowOrders.userId, access.userId!)),
      access.isOwner
        ? db.select().from(schema.flowTransactions)
        : db.select().from(schema.flowTransactions).where(eq(schema.flowTransactions.userId, access.userId!)),
      access.isOwner
        ? db.select().from(schema.flowProducts)
        : db.select().from(schema.flowProducts).where(eq(schema.flowProducts.userId, access.userId!)),
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
