import mongoose from "mongoose";
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

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  return null;
}

export async function PUT(request, { params }) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    if (!mongoose.isObjectIdOrHexString(id)) {
      return Response.json({ error: "Invalid service ID." }, { status: 400 });
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
    const service = await Service.findByIdAndUpdate(id, validation.data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!service) {
      return Response.json({ error: "Service not found." }, { status: 404 });
    }

    return Response.json({ service });
  } catch (error) {
    console.error("Update service route failed:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    if (!mongoose.isObjectIdOrHexString(id)) {
      return Response.json({ error: "Invalid service ID." }, { status: 400 });
    }

    await connectDB();
    const service = await Service.findByIdAndDelete(id).lean();

    if (!service) {
      return Response.json({ error: "Service not found." }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete service route failed:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
