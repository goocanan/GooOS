import { NextRequest, NextResponse } from "next/server";
import { getUserAccess } from "@/lib/access-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const access = await getUserAccess(req);
    return NextResponse.json({
      success: true,
      data: access,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
