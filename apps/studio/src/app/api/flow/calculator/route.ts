import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const settingsList = await db.select().from(schema.flowSettings).limit(1);
    const settings = settingsList[0] || {
      electricityCostPerKwh: 1500,
      printerPowerWatt: 150,
      operatorCostPerHour: 25000,
      defaultMarginPercent: 50,
      investmentCostTotal: 5000000,
      investmentPaybackMonths: 12,
      monthlyPrintHours: 150,
      lowStockThreshold: 200,
    };

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
