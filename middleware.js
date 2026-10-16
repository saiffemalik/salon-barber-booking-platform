import { errors, jwtVerify } from "jose";
import { NextResponse } from "next/server";

const TOKEN_COOKIE = "token";
const TOKEN_ISSUER = "salon-barber-booking";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error("JWT_SECRET must be set to a value of at least 32 bytes.");
  }

  return new TextEncoder().encode(secret);
}

async function verifyToken(token) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
    });
    return payload;
  } catch (error) {
    if (error instanceof errors.JOSEError) return null;
    throw error;
  }
}

export async function middleware(request) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const payload = await verifyToken(token);

  if (!payload || typeof payload.sub !== "string") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    request.nextUrl.pathname === "/admin" ||
    request.nextUrl.pathname.startsWith("/admin/")
  ) {
    if (payload.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/book/:path*", "/admin/:path*"],
};
