import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { setAuthCookie, signToken } from "@/lib/auth";
import User from "@/models/User";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const MAX_RATE_LIMIT_ENTRIES = 10_000;
const attemptsByIp = new Map();

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z
    .string()
    .min(1)
    .refine((password) => new TextEncoder().encode(password).length <= 72, {
      error: "Invalid email or password.",
    }),
});

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();
  return forwardedIp || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  let entry = attemptsByIp.get(ip);

  if (!entry || now - entry.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
    entry = { count: 0, windowStartedAt: now };
    attemptsByIp.set(ip, entry);
  }

  entry.count += 1;

  if (attemptsByIp.size > MAX_RATE_LIMIT_ENTRIES) {
    for (const [key, value] of attemptsByIp) {
      if (now - value.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
        attemptsByIp.delete(key);
      }
    }
    if (attemptsByIp.size > MAX_RATE_LIMIT_ENTRIES) {
      const oldestKey = attemptsByIp.keys().next().value;
      if (oldestKey !== undefined) attemptsByIp.delete(oldestKey);
    }
  }

  return {
    allowed: entry.count <= RATE_LIMIT_MAX_ATTEMPTS,
    retryAfter: Math.max(
      1,
      Math.ceil((entry.windowStartedAt + RATE_LIMIT_WINDOW_MS - now) / 1000),
    ),
  };
}

export async function POST(request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    throw error;
  }

  const validation = loginSchema.safeParse(body);
  if (!validation.success) {
    return Response.json({ error: "Invalid email or password." }, { status: 400 });
  }

  const { email, password } = validation.data;

  try {
    await connectDB();

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const userId = user._id.toString();
    const token = await signToken({
      sub: userId,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    await setAuthCookie(token);

    return Response.json({
      user: { id: userId, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login route failed:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
