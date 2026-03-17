import { col } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { userId, action } = await request.json();

  if (!userId || !action) {
    return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
  }

  try {
    const accounts = col("accounts");
    const users = col("users");

    switch (action) {
      case "ban":
        await users.updateOne({ _id: userId }, { $set: { disabled: true } });
        await accounts.updateOne({ _id: userId }, { $set: { disabled: true } });
        break;
      case "unban":
        await users.updateOne({ _id: userId }, { $unset: { disabled: "" } });
        await accounts.updateOne({ _id: userId }, { $unset: { disabled: "" } });
        break;
      case "delete":
        await users.updateOne({ _id: userId }, { $set: { flags: 8 } }); // deleted flag
        await accounts.updateOne({ _id: userId }, { $set: { disabled: true } });
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
