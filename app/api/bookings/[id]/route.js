import mongoose from "mongoose";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Service from "@/models/Service";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a valid date.");

const updateSchema = z
  .object({
    serviceId: z.string().refine(mongoose.isObjectIdOrHexString, "Invalid service ID."),
    date: dateSchema,
    time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time in HH:mm format."),
    status: z.enum(["pending", "confirmed", "cancelled"]),
    notes: z.string().trim().max(1000),
  })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

function isPastDate(value) {
  const today = new Date().toISOString().slice(0, 10);
  return value < today;
}

function isDuplicateSlot(error) {
  return error && typeof error === "object" && "code" in error && error.code === 11000;
}

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!["customer", "admin"].includes(user.role)) {
      return Response.json({ error: "Invalid account role." }, { status: 403 });
    }
    if (!mongoose.isObjectIdOrHexString(user.sub)) {
      return Response.json({ error: "Invalid session." }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.isObjectIdOrHexString(id)) {
      return Response.json({ error: "Invalid booking ID." }, { status: 400 });
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

    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { error: "Invalid booking details.", issues: validation.error.issues },
        { status: 400 },
      );
    }

    const updates = validation.data;
    if (updates.date && isPastDate(updates.date)) {
      return Response.json({ error: "Bookings cannot be moved to past dates." }, { status: 400 });
    }
    if (user.role !== "admin" && updates.status && updates.status !== "cancelled") {
      return Response.json({ error: "Customers may only cancel bookings." }, { status: 403 });
    }

    await connectDB();
    const booking = await Booking.findById(id);
    if (!booking) {
      return Response.json({ error: "Booking not found." }, { status: 404 });
    }
    if (user.role !== "admin" && booking.user.toString() !== user.sub) {
      return Response.json({ error: "You cannot update this booking." }, { status: 403 });
    }

    if (updates.serviceId) {
      const service = await Service.findById(updates.serviceId).select("_id").lean();
      if (!service) {
        return Response.json({ error: "Service not found." }, { status: 404 });
      }
      booking.service = service._id;
    }
    if (updates.date) {
      booking.date = new Date(`${updates.date}T00:00:00.000Z`);
    }
    if (updates.time) booking.time = updates.time;
    if (updates.status) booking.status = updates.status;
    if (updates.notes !== undefined) booking.notes = updates.notes;

    await booking.save();
    await booking.populate("service", "name");

    return Response.json({ booking });
  } catch (error) {
    if (isDuplicateSlot(error)) {
      return Response.json({ error: "This service is already booked at that time." }, { status: 409 });
    }

    console.error("Update booking route failed:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!["customer", "admin"].includes(user.role)) {
      return Response.json({ error: "Invalid account role." }, { status: 403 });
    }
    if (!mongoose.isObjectIdOrHexString(user.sub)) {
      return Response.json({ error: "Invalid session." }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.isObjectIdOrHexString(id)) {
      return Response.json({ error: "Invalid booking ID." }, { status: 400 });
    }

    await connectDB();
    const booking = await Booking.findById(id);
    if (!booking) {
      return Response.json({ error: "Booking not found." }, { status: 404 });
    }
    if (user.role !== "admin" && booking.user.toString() !== user.sub) {
      return Response.json({ error: "You cannot delete this booking." }, { status: 403 });
    }

    await booking.deleteOne();
    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete booking route failed:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
