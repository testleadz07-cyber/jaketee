import { NextFetchEvent } from "next/server";
import middleware, { NextRequestWithAuth } from "next-auth/middleware";

export default function proxy(req: NextRequestWithAuth, event: NextFetchEvent) {
  return middleware(req, event);
}

export const config = {
  matcher: ["/admin/:path*"],
};
