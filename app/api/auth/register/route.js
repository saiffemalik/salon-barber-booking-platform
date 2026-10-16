import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { setAuthCookie, signToken } from "@/lib/auth";
import User from "@/models/User";

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().trim().toLowerCase(),
  password: z
    .string()
    .min(8)
    .refine((password) => new TextEncoder().encode(password).length <= 72, {
      error: "Password must be no more than 72 bytes.",
    }),
});

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    throw error;
  }

  const validation = registerSchema.safeParse(body);
  if (!validation.success) {
    return Response.json(
      { error: "Invalid registration details.", issues: validation.error.issues },
      { status: 400 },
    );
  }

  const { name, email, password } = validation.data;

  try {
    await connectDB();

    if (await User.exists({ email })) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    const userId = user._id.toString();
    const token = await signToken({
      sub: userId,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    await setAuthCookie(token);

    return Response.json(
      { user: { id: userId, name: user.name, email: user.email, role: user.role } },
      { status: 201 },
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    console.error("Registration route failed:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
