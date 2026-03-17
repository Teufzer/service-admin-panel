import { col } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { action } = await request.json();

  if (!action || !["resolve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json({ error: "Missing report ID" }, { status: 400 });
  }

  try {
    const reports = col("safety_reports");
    const status = action === "resolve" ? "Resolved" : "Rejected";

    const result = await reports.updateOne(
      { _id: id } as any,
      {
        $set: {
          status,
          closed_at: new Date().toISOString(),
        },
      } as any
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
