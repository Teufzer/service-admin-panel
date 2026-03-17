import { col } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    // ULID prefix for 7 days ago (approximate)
    const sevenDaysAgoUlid = Math.floor(sevenDaysAgo.getTime()).toString(32).toUpperCase().padStart(10, "0");

    const [
      totalUsers,
      totalServers,
      openReports,
      totalMessages,
      newUsers,
      bannedUsers,
    ] = await Promise.all([
      col("users").countDocuments({}),
      col("servers").countDocuments({}),
      col("safety_reports").countDocuments({ status: "Created" } as any),
      col("messages").countDocuments({}),
      col("users").countDocuments({ _id: { $gte: sevenDaysAgoUlid } } as any),
      col("accounts").countDocuments({ disabled: true } as any),
    ]);

    return NextResponse.json({
      totalUsers,
      totalServers,
      openReports,
      totalMessages,
      newUsers,
      bannedUsers,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
