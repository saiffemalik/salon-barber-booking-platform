import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { setAuthCookie, signToken } from "@/lib/auth";
import User from "@/models/User";

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z
    .string()
    .min(1)
    .refine((password) => new TextEncoder().encode(password).length <= 72, {
      error: "Invalid email or password.",
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
