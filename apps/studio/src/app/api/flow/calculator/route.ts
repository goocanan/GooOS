import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const existingList = await db.select().from(schema.flowSettings).limit(1);
    const existing = existingList[0];

    const fieldsToUpdate: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.electricityCostPerKwh !== undefined)
      fieldsToUpdate.electricityCostPerKwh = Math.round(Number(body.electricityCostPerKwh));
    if (body.printerPowerWatt !== undefined)
      fieldsToUpdate.printerPowerWatt = Math.round(Number(body.printerPowerWatt));
    if (body.operatorCostPerHour !== undefined)
      fieldsToUpdate.operatorCostPerHour = Math.round(Number(body.operatorCostPerHour));
    if (body.defaultMarginPercent !== undefined)
      fieldsToUpdate.defaultMarginPercent = Math.round(Number(body.defaultMarginPercent));
    if (body.investmentCostTotal !== undefined)
      fieldsToUpdate.investmentCostTotal = Math.round(Number(body.investmentCostTotal));
    if (body.investmentPaybackMonths !== undefined)
      fieldsToUpdate.investmentPaybackMonths = Math.round(Number(body.investmentPaybackMonths));
    if (body.monthlyPrintHours !== undefined)
      fieldsToUpdate.monthlyPrintHours = Math.round(Number(body.monthlyPrintHours));
    if (body.lowStockThreshold !== undefined)
      fieldsToUpdate.lowStockThreshold = Math.round(Number(body.lowStockThreshold));

    if (existing) {
      await db
        .update(schema.flowSettings)
        .set(fieldsToUpdate)
        .where(eq(schema.flowSettings.id, existing.id));

      const updated = await db
        .select()
        .from(schema.flowSettings)
        .where(eq(schema.flowSettings.id, existing.id))
        .limit(1);

      return NextResponse.json({
        success: true,
        data: updated[0],
      });
    } else {
      const ws = await db
        .select({ id: schema.workspaces.id })
        .from(schema.workspaces)
        .limit(1);
      const workspaceId = ws[0]?.id || "ws_3817e3eb6c344c4da519";
      const userId = "fl198gkgaDmA4tQHSject4zcUNf3THbx";

      const newId = crypto.randomUUID();
      await db.insert(schema.flowSettings).values({
        id: newId,
        workspaceId,
        userId,
        electricityCostPerKwh: fieldsToUpdate.electricityCostPerKwh ?? 1500,
        printerPowerWatt: fieldsToUpdate.printerPowerWatt ?? 150,
        operatorCostPerHour: fieldsToUpdate.operatorCostPerHour ?? 25000,
        defaultMarginPercent: fieldsToUpdate.defaultMarginPercent ?? 50,
        investmentCostTotal: fieldsToUpdate.investmentCostTotal ?? 5000000,
        investmentPaybackMonths: fieldsToUpdate.investmentPaybackMonths ?? 12,
        monthlyPrintHours: fieldsToUpdate.monthlyPrintHours ?? 150,
        lowStockThreshold: fieldsToUpdate.lowStockThreshold ?? 200,
      });

      const inserted = await db
        .select()
        .from(schema.flowSettings)
        .where(eq(schema.flowSettings.id, newId))
        .limit(1);

      return NextResponse.json({
        success: true,
        data: inserted[0],
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
