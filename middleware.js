import { NextResponse } from "next/server";

export function middleware() {
  // Auth bypassed — access protected by Caddy basicauth
  return NextResponse.next();
}

export const config = {
  matcher: ["/panel", "/panel/:path*"],
};
