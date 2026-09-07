import { NextRequest, NextResponse } from "next/server";
import { SESSION_VERIFIED_COOKIE, isValidSessionVerifiedToken } from "./app/intake/lib/security/deviceToken";

// Route guard for every PHI-bearing screen — structured as Proxy (Next.js
// 16's renamed `middleware.ts` convention — see docs/architecture.md) so a
// new screen added under a protected path is covered automatically,
// instead of relying on each page remembering to check verification
// itself. Only `/intake` (welcome/instructions) and `/intake/verify`
// (PIN entry or full verification, whichever this device needs) are
// reachable by an unverified device; every other path under `/intake/*`
// redirects there.
//
// Checks the SESSION-verified token specifically, not device trust alone
// (see deviceToken.ts's header comment) — holding a long-lived device-
// trust cookie means this device is ALLOWED to use the PIN shortcut, not
// that the current visit has actually been unlocked yet. Sequencing per
// spec: PIN/full verification must succeed THIS visit before any PHI
// (scheduling info, health history, insurance, etc.) is reachable.
const PUBLIC_INTAKE_PATHS = ["/intake", "/intake/verify"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_INTAKE_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_VERIFIED_COOKIE)?.value;
  const verified = await isValidSessionVerifiedToken(token);

  if (!verified) {
    const verifyUrl = new URL("/intake/verify", request.url);
    verifyUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(verifyUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/intake/:path*"],
};
