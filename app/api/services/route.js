import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Service from "@/models/Service";

const serviceSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    durationMins: z.number().int().positive(),
    price: z.number().finite().nonnegative(),
    description: z.string().trim().min(1).max(2000),
  })
  .strict();

export async function GET() {
  try {
    await connectDB();
    const services = await Service.find().sort({ name: 1 }).lean();
    return Response.json({ services });
  } catch (error) {
    console.error("Get services route failed:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    if (user.role !== "admin") {
      return Response.json({ error: "Admin access required." }, { status: 403 });
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

    const validation = serviceSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { error: "Invalid service details.", issues: validation.error.issues },
        { status: 400 },
      );
    }

    await connectDB();
    const service = await Service.create(validation.data);

    return Response.json({ service }, { status: 201 });
  } catch (error) {
    console.error("Create service route failed:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
