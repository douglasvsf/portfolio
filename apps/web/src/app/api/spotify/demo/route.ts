import { NextResponse, type NextRequest } from "next/server";
import { routes } from "@/config/spotify";
import { requestOrigin } from "@/lib/spotify/request-origin";
import { DEMO_COOKIE, demoCookieOptions } from "@/lib/spotify/session";

/** "View demo": liga o modo demonstrativo (dados mockados) e abre o dashboard. */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL(routes.dashboard, requestOrigin(request)));
  response.cookies.set(DEMO_COOKIE, "1", demoCookieOptions);
  return response;
}
