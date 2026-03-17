import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        if (process.env.NEXT_PUBLIC_AUTH_TYPE === "none") return true;
        return !!token;
      },
    },
    pages: { signIn: "/" },
  },
);

export const config = {
  matcher: ["/panel", "/panel/:path*"],
};
