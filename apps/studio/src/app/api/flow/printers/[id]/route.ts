import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@gooos/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await db
      .select()
      .from(schema.flowPrinters)
      .where(eq(schema.flowPrinters.id, id))
      .limit(1);

    const printer = rows[0];
    if (!printer) {
      return NextResponse.json(
        { success: false, error: "Printer tidak ditemukan" },
        { status: 404 }
      );
    }

    const parts = await db
      .select()
      .from(schema.flowAssets)
      .where(eq(schema.flowAssets.printerId, id));

    return NextResponse.json({
      success: true,
      data: {
        ...printer,
        parts,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.model !== undefined) updateData.model = body.model;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.purchasePrice !== undefined) updateData.purchasePrice = Number(body.purchasePrice);
    if (body.purchaseDate !== undefined) updateData.purchaseDate = new Date(body.purchaseDate);
    if (body.serialNumber !== undefined) updateData.serialNumber = body.serialNumber;
    if (body.buildVolume !== undefined) updateData.buildVolume = body.buildVolume;
    if (body.nozzleInstalled !== undefined) updateData.nozzleInstalled = body.nozzleInstalled;
    if (body.bedPlateInstalled !== undefined) updateData.bedPlateInstalled = body.bedPlateInstalled;
    if (body.maintenanceIntervalDays !== undefined) updateData.maintenanceIntervalDays = Number(body.maintenanceIntervalDays);
    if (body.lastMaintenanceDate !== undefined) updateData.lastMaintenanceDate = body.lastMaintenanceDate ? new Date(body.lastMaintenanceDate) : null;
    if (body.nextMaintenanceDate !== undefined) updateData.nextMaintenanceDate = body.nextMaintenanceDate ? new Date(body.nextMaintenanceDate) : null;
    if (body.maintenanceChecklist !== undefined) updateData.maintenanceChecklist = body.maintenanceChecklist;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.productLink !== undefined) updateData.productLink = body.productLink;

    const [updated] = await db
      .update(schema.flowPrinters)
      .set(updateData)
      .where(eq(schema.flowPrinters.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Printer tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(schema.flowPrinters)
      .where(eq(schema.flowPrinters.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Printer tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deleted,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
