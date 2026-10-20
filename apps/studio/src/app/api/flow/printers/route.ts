import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { desc, eq, or } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const printers = await db
      .select()
      .from(schema.flowPrinters)
      .orderBy(desc(schema.flowPrinters.createdAt));

    const assets = await db
      .select()
      .from(schema.flowAssets);

    // Group assets by printer
    const enrichedPrinters = printers.map((p) => {
      const printerParts = assets.filter((a) => {
        if (a.category !== "part") return false;
        if (a.printerId === p.id) return true;
        // fallback matching by printer name in part name
        if (!a.printerId && p.name) {
          const pNameLower = p.name.toLowerCase();
          const aNameLower = a.name.toLowerCase();
          if (pNameLower.includes("a1") && aNameLower.includes("a1")) return true;
          if (pNameLower.includes("creality") && aNameLower.includes("creality")) return true;
        }
        return false;
      });

      const totalPartsCount = printerParts.reduce((acc, part) => acc + (part.quantity || 1), 0);
      const totalPartsValue = printerParts.reduce((acc, part) => acc + (part.price || 0) * (part.quantity || 1), 0);

      // Check maintenance status
      let maintenanceStatus: "ok" | "due_soon" | "overdue" = "ok";
      if (p.nextMaintenanceDate) {
        const nextDate = new Date(p.nextMaintenanceDate).getTime();
        const now = Date.now();
        const diffDays = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          maintenanceStatus = "overdue";
        } else if (diffDays <= 7) {
          maintenanceStatus = "due_soon";
        }
      }

      return {
        ...p,
        parts: printerParts,
        totalPartsCount,
        totalPartsValue: Math.round(totalPartsValue),
        maintenanceStatus,
      };
    });

    // Also get general parts (not tied to a specific printer)
    const generalParts = assets.filter((a) => {
      if (a.category !== "part") return false;
      const matched = printers.some((p) => {
        if (a.printerId === p.id) return true;
        const pNameLower = p.name.toLowerCase();
        const aNameLower = a.name.toLowerCase();
        if (pNameLower.includes("a1") && aNameLower.includes("a1")) return true;
        if (pNameLower.includes("creality") && aNameLower.includes("creality")) return true;
        return false;
      });
      return !matched;
    });

    const fleetPurchaseValue = printers.reduce((acc, p) => acc + (p.purchasePrice || 0), 0);
    const totalPartsValue = assets
      .filter((a) => a.category === "part")
      .reduce((acc, a) => acc + (a.price || 0) * (a.quantity || 1), 0);

    return NextResponse.json({
      success: true,
      data: enrichedPrinters,
      generalParts,
      summary: {
        totalPrinters: printers.length,
        fleetPurchaseValue: Math.round(fleetPurchaseValue),
        totalPartsValue: Math.round(totalPartsValue),
        totalAssetsValue: Math.round(fleetPurchaseValue + totalPartsValue),
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

    if (!body.name || !body.model) {
      return NextResponse.json(
        { success: false, error: "Nama printer dan tipe model wajib diisi" },
        { status: 400 }
      );
    }

    // Default workspace & user id
    const ws = await db
      .select({ id: schema.workspaces.id })
      .from(schema.workspaces)
      .limit(1);
    const workspaceId = body.workspaceId || ws[0]?.id || "ws_3817e3eb6c344c4da519";
    const userId = body.userId || "fl198gkgaDmA4tQHSject4zcUNf3THbx";

    const newId = body.id || crypto.randomUUID();
    const purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : new Date();
    const intervalDays = Number(body.maintenanceIntervalDays) || 30;

    const nextMaintenance = new Date();
    nextMaintenance.setDate(nextMaintenance.getDate() + intervalDays);

    const defaultChecklist = [
      {
        id: "clean_bed",
        title: "Pembersihan Bed Plate / Sheet",
        frequency: "Setiap 5-10 print",
        lastCompleted: new Date().toISOString().split("T")[0],
        done: true,
      },
      {
        id: "lube_rails",
        title: "Pelumasan Linear Rail / Rods & Lead Screw",
        frequency: `Setiap ${intervalDays} hari`,
        lastCompleted: new Date().toISOString().split("T")[0],
        done: true,
      },
      {
        id: "clean_nozzle",
        title: "Pemeriksaan & Pembersihan Nozzle",
        frequency: "Setiap 50 jam cetak",
        lastCompleted: new Date().toISOString().split("T")[0],
        done: true,
      },
      {
        id: "check_belts",
        title: "Cek Ketegangan Belt & Retensioning",
        frequency: "Setiap 3 bulan",
        lastCompleted: new Date().toISOString().split("T")[0],
        done: true,
      },
    ];

    const [created] = await db
      .insert(schema.flowPrinters)
      .values({
        id: newId,
        workspaceId,
        userId,
        name: body.name,
        model: body.model,
        status: body.status || "idle",
        purchasePrice: Number(body.purchasePrice) || 0,
        purchaseDate,
        serialNumber: body.serialNumber || null,
        buildVolume: body.buildVolume || null,
        nozzleInstalled: body.nozzleInstalled || "0.4mm Standard",
        bedPlateInstalled: body.bedPlateInstalled || "Textured PEI Plate",
        maintenanceIntervalDays: intervalDays,
        lastMaintenanceDate: new Date(),
        nextMaintenanceDate: nextMaintenance,
        maintenanceChecklist: body.maintenanceChecklist || defaultChecklist,
        notes: body.notes || null,
        productLink: body.productLink || null,
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
