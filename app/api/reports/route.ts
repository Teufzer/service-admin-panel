import { col } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const reports = col("safety_reports");
    const docs = await reports
      .find({})
      .sort({ _id: -1 })
      .limit(100)
      .toArray();
    return NextResponse.json({ reports: docs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
