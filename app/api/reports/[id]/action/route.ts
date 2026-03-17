import { col } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { action } = await request.json();
  if (!action || !["resolve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const reports = col("safety_reports");
    const status = action === "resolve" ? "Resolved" : "Rejected";

    await reports.updateOne(
      { _id: params.id } as any,
      {
        $set: {
          status,
          closed_at: new Date().toISOString(),
        },
      } as any
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
