import { col } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { ulid } from "ulid";

export async function POST(request: NextRequest) {
  try {
    const { contentType, contentId, reason, context } = await request.json();

    if (!contentType || !contentId) {
      return NextResponse.json({ error: "contentType and contentId are required" }, { status: 400 });
    }

    const id = ulid();
    await col("safety_reports").insertOne({
      _id: id,
      author_id: "admin",
      content: {
        type: contentType,
        id: contentId,
        report_reason: reason ?? "NoneSpecified",
      },
      additional_context: context ?? "",
      status: "Created",
    } as any);

    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
