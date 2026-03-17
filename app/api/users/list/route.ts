import { col } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");
  const search = searchParams.get("search") || "";
  const PER_PAGE = 50;

  try {
    const users = col("users");

    const query: any = search
      ? {
          $or: [
            { username: { $regex: search, $options: "i" } },
            { display_name: { $regex: search, $options: "i" } },
            { _id: search },
          ],
        }
      : {};

    const [docs, total] = await Promise.all([
      users
        .find(query, {
          projection: { _id: 1, username: 1, discriminator: 1, display_name: 1, badges: 1, disabled: 1, flags: 1 },
        })
        .sort({ _id: -1 })
        .skip(page * PER_PAGE)
        .limit(PER_PAGE)
        .toArray(),
      users.countDocuments(query),
    ]);

    return NextResponse.json({ users: docs, total });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
