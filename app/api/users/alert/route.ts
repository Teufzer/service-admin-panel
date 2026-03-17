import { sendPlatformAlert } from "@/lib/core";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { userId, content } = await request.json();
  if (!userId || !content) {
    return NextResponse.json({ error: "Missing userId or content" }, { status: 400 });
  }
  try {
    await sendPlatformAlert(userId, content);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
