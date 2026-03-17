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
    const query: any = { _id: userId };

    switch (action) {
      case "ban":
        await users.updateOne(query, { $set: { disabled: true } } as any);
        await accounts.updateOne(query, { $set: { disabled: true } } as any);
        break;
      case "unban":
        await users.updateOne(query, { $unset: { disabled: "" } } as any);
        await accounts.updateOne(query, { $unset: { disabled: "" } } as any);
        break;
      case "delete":
        await users.updateOne(query, { $set: { flags: 8 } } as any);
        await accounts.updateOne(query, { $set: { disabled: true } } as any);
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
