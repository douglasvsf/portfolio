import { NextResponse, type NextRequest } from "next/server";
import { routes } from "@/config/spotify";
import { requestOrigin } from "@/lib/spotify/request-origin";
import { DEMO_COOKIE, DEMO_MOCK_VALUE, demoCookieOptions } from "@/lib/spotify/session";

/**
 * "Explore"/"View demo": abre o dashboard sem login — vitrine com os dados do
 * dono quando configurada, senão o mock. `?data=mock` força o mock (E2E).
 */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL(routes.dashboard, requestOrigin(request)));
  const mockOnly = request.nextUrl.searchParams.get("data") === "mock";
  response.cookies.set(DEMO_COOKIE, mockOnly ? DEMO_MOCK_VALUE : "1", demoCookieOptions);
  return response;
}
