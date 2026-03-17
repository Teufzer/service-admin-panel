import { col } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");
  const search = searchParams.get("search") || "";
  const PER_PAGE = 50;

  try {
    const servers = col("servers");

    const query = search
      ? { $or: [{ name: { $regex: search, $options: "i" } }, { _id: search }] }
      : {};

    const [docs, total] = await Promise.all([
      servers
        .find(query, { projection: { _id: 1, name: 1, description: 1, owner: 1, flags: 1 } })
        .sort({ _id: -1 })
        .skip(page * PER_PAGE)
        .limit(PER_PAGE)
        .toArray(),
      servers.countDocuments(query),
    ]);

    return NextResponse.json({ servers: docs, total });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
