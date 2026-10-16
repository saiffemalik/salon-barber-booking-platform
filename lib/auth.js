import { errors, jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const TOKEN_COOKIE = "token";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
const TOKEN_ISSUER = "salon-barber-booking";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error("JWT_SECRET must be set to a value of at least 32 bytes.");
  }

  return new TextEncoder().encode(secret);
}

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(TOKEN_ISSUER)
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyToken(token) {
  if (typeof token !== "string" || token.length === 0) return null;

  const secret = getJwtSecret();

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
    });
    return payload;
  } catch (error) {
    if (error instanceof errors.JOSEError) return null;
    throw error;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (
    !payload ||
    typeof payload.sub !== "string" ||
    typeof payload.role !== "string" ||
    typeof payload.name !== "string" ||
    typeof payload.email !== "string"
  ) {
    return null;
  }

  return payload;
}

export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
