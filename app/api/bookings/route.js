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

const bookingSchema = z
  .object({
    serviceId: z.string().refine(mongoose.isObjectIdOrHexString, "Invalid service ID."),
    date: dateSchema,
    time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time in HH:mm format."),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

function isPastDate(value) {
  const today = new Date().toISOString().slice(0, 10);
  return value < today;
}

function isDuplicateSlot(error) {
  return error && typeof error === "object" && "code" in error && error.code === 11000;
}

export async function GET() {
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

    await connectDB();
    const filter = user.role === "admin" ? {} : { user: user.sub };
    const bookings = await Booking.find(filter)
      .sort({ date: 1, time: 1 })
      .populate("service", "name")
      .lean();

    return Response.json({ bookings });
  } catch (error) {
    console.error("Get bookings route failed:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!mongoose.isObjectIdOrHexString(user.sub)) {
      return Response.json({ error: "Invalid session." }, { status: 401 });
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

    const validation = bookingSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { error: "Invalid booking details.", issues: validation.error.issues },
        { status: 400 },
      );
    }

    const { serviceId, date, time, notes } = validation.data;
    if (isPastDate(date)) {
      return Response.json({ error: "Bookings cannot be made for past dates." }, { status: 400 });
    }

    await connectDB();
    const service = await Service.findById(serviceId).select("_id").lean();
    if (!service) {
      return Response.json({ error: "Service not found." }, { status: 404 });
    }

    const booking = await Booking.create({
      user: user.sub,
      service: serviceId,
      date: new Date(`${date}T00:00:00.000Z`),
      time,
      ...(notes === undefined ? {} : { notes }),
    });
    await booking.populate("service", "name");

    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    if (isDuplicateSlot(error)) {
      return Response.json({ error: "This service is already booked at that time." }, { status: 409 });
    }

    console.error("Create booking route failed:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
