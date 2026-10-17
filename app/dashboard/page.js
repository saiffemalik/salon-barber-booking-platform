"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Schibsted_Grotesk } from "next/font/google";

const font = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fieldClass =
  "min-h-11 w-full rounded-md border border-[#b4b9b0] bg-white px-3 text-base text-[#17212b] outline-none transition-colors focus:border-[#17212b] focus-visible:ring-2 focus-visible:ring-[#17212b]/25 disabled:cursor-not-allowed disabled:bg-[#eef0eb]";

const labelClass = "mb-1.5 block text-sm font-medium text-[#17212b]";

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function bookingDateValue(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function formatBookingDate(value) {
  if (!value) return "Date not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return date.toLocaleDateString("en-IE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function statusClass(status) {
  if (status === "confirmed") return "bg-[#e4eee6] text-[#285c38]";
  if (status === "cancelled") return "bg-[#f5e6e3] text-[#8b3029]";
  return "bg-[#f4eedc] text-[#745a17]";
}

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minDate, setMinDate] = useState("");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editValues, setEditValues] = useState({ date: "", time: "", notes: "" });
  const [pendingId, setPendingId] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadBookings() {
      try {
        const response = await fetch("/api/bookings", { signal: controller.signal });
        const result = await readResponse(response);

        if (!response.ok) {
          throw new Error(result.error || "Unable to load your bookings.");
        }

        setBookings(Array.isArray(result.bookings) ? result.bookings : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          setLoadError(
            error instanceof Error ? error.message : "Unable to load your bookings.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setMinDate(localDateString());
          setLoading(false);
        }
      }
    }

    loadBookings();
    return () => controller.abort();
  }, []);

  function startEditing(booking) {
    setActionError("");
    setActionSuccess("");
    setEditingId(String(booking._id));
    setEditValues({
      date: bookingDateValue(booking.date),
      time: booking.time || "",
      notes: booking.notes || "",
    });
  }

  function stopEditing() {
    setEditingId("");
    setEditValues({ date: "", time: "", notes: "" });
    setActionError("");
  }

  async function saveBooking(event, booking) {
    event.preventDefault();
    setActionError("");
    setActionSuccess("");

    const updates = {};
    if (editValues.date !== bookingDateValue(booking.date)) updates.date = editValues.date;
    if (editValues.time !== booking.time) updates.time = editValues.time;
    if (editValues.notes !== (booking.notes || "")) updates.notes = editValues.notes;

    if (Object.keys(updates).length === 0) {
      setActionError("Make a change before saving.");
      return;
    }

    setPendingId(String(booking._id));
    try {
      const response = await fetch(`/api/bookings/${booking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const result = await readResponse(response);

      if (!response.ok) {
        setActionError(result.error || "Unable to update this booking.");
        return;
      }

      setBookings((current) =>
        current.map((item) =>
          String(item._id) === String(booking._id) ? result.booking : item,
        ),
      );
      setEditingId("");
      setActionSuccess("Your booking has been updated.");
    } catch {
      setActionError("We couldn't connect. Check your internet connection and try again.");
    } finally {
      setPendingId("");
    }
  }

  async function cancelBooking(booking) {
    const serviceName = booking.service?.name || "this appointment";
    if (!window.confirm(`Cancel ${serviceName} on ${formatBookingDate(booking.date)}?`)) {
      return;
    }

    setActionError("");
    setActionSuccess("");
    setPendingId(String(booking._id));

    try {
      const response = await fetch(`/api/bookings/${booking._id}`, { method: "DELETE" });
      const result = await readResponse(response);

      if (!response.ok) {
        setActionError(result.error || "Unable to cancel this booking.");
        return;
      }

      setBookings((current) =>
        current.filter((item) => String(item._id) !== String(booking._id)),
      );
      if (editingId === String(booking._id)) setEditingId("");
      setActionSuccess("Your booking has been cancelled.");
    } catch {
      setActionError("We couldn't connect. Check your internet connection and try again.");
    } finally {
      setPendingId("");
    }
  }

  return (
    <main className={`${font.className} flex-1 bg-[#e8eae4] px-4 py-10 text-[#17212b] sm:px-8 lg:py-16`}>
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#5d6873]">
              Your appointments
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Booking dashboard
            </h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-[#4d5862]">
              View and manage your upcoming visits.
            </p>
          </div>
          <Link
            href="/book"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#17212b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#b8322a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212b]"
          >
            Book an appointment
          </Link>
        </div>

        {actionError ? (
          <p
            role="alert"
            className="mt-8 border-l-4 border-[#b8322a] bg-white px-4 py-3 text-sm leading-6 text-[#17212b]"
          >
            {actionError}
          </p>
        ) : null}
        {actionSuccess ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-8 border-l-4 border-[#285c38] bg-white px-4 py-3 text-sm leading-6 text-[#17212b]"
          >
            {actionSuccess}
          </p>
        ) : null}

        {loading ? (
          <p role="status" aria-live="polite" className="mt-10 text-sm text-[#4d5862]">
            Loading your bookings...
          </p>
        ) : null}

        {!loading && loadError ? (
          <p
            role="alert"
            className="mt-10 border-l-4 border-[#b8322a] bg-white px-4 py-3 text-sm leading-6"
          >
            {loadError}
          </p>
        ) : null}

        {!loading && !loadError && bookings.length === 0 ? (
          <section className="mt-10 border border-[#b4b9b0] bg-[#fbfbf9] p-6 sm:p-8">
            <h2 className="text-xl font-semibold">No bookings yet</h2>
            <p className="mt-2 text-sm leading-6 text-[#4d5862]">
              When you book an appointment, you&rsquo;ll be able to manage it here.
            </p>
            <Link
              href="/book"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-[#17212b] px-5 text-sm font-semibold text-[#17212b] transition-colors hover:bg-[#17212b] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212b]"
            >
              Browse services
            </Link>
          </section>
        ) : null}

        {!loading && !loadError && bookings.length > 0 ? (
          <ul className="mt-10 space-y-5" aria-label="Your bookings">
            {bookings.map((booking) => {
              const id = String(booking._id);
              const isEditing = editingId === id;
              const isPending = pendingId === id;

              return (
                <li key={id} className="border border-[#b4b9b0] bg-[#fbfbf9]">
                  <div
                    aria-hidden="true"
                    className="h-1.5"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(135deg, #b8322a 0 10px, #fbfbf9 10px 20px, #25406b 20px 30px, #fbfbf9 30px 40px)",
                    }}
                  />
                  <article className="p-5 sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold">
                          {booking.service?.name || "Service unavailable"}
                        </h2>
                        <p className="mt-1 text-sm text-[#5d6873]">
                          {formatBookingDate(booking.date)}
                          {booking.time ? ` · ${booking.time}` : ""}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(booking.status)}`}
                      >
                        {booking.status || "pending"}
                      </span>
                    </div>

                    {booking.notes ? (
                      <p className="mt-4 text-sm leading-6 text-[#4d5862]">
                        <span className="font-medium text-[#17212b]">Notes:</span> {booking.notes}
                      </p>
                    ) : null}

                    {isEditing ? (
                      <form
                        onSubmit={(event) => saveBooking(event, booking)}
                        className="mt-6 border-t border-dashed border-[#b4b9b0] pt-5"
                        aria-busy={isPending}
                      >
                        <h3 className="text-base font-semibold">Edit booking</h3>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor={`date-${id}`} className={labelClass}>
                              Date
                            </label>
                            <input
                              id={`date-${id}`}
                              type="date"
                              min={
                                bookingDateValue(booking.date) < minDate
                                  ? undefined
                                  : minDate
                              }
                              required
                              value={editValues.date}
                              onChange={(event) =>
                                setEditValues((current) => ({ ...current, date: event.target.value }))
                              }
                              disabled={isPending}
                              className={fieldClass}
                            />
                          </div>
                          <div>
                            <label htmlFor={`time-${id}`} className={labelClass}>
                              Time
                            </label>
                            <input
                              id={`time-${id}`}
                              type="time"
                              required
                              value={editValues.time}
                              onChange={(event) =>
                                setEditValues((current) => ({ ...current, time: event.target.value }))
                              }
                              disabled={isPending}
                              className={fieldClass}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label htmlFor={`notes-${id}`} className={labelClass}>
                            Notes
                          </label>
                          <textarea
                            id={`notes-${id}`}
                            rows={3}
                            maxLength={1000}
                            value={editValues.notes}
                            onChange={(event) =>
                              setEditValues((current) => ({ ...current, notes: event.target.value }))
                            }
                            disabled={isPending}
                            className={`${fieldClass} py-3`}
                          />
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#17212b] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#b8322a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212b] disabled:opacity-50"
                          >
                            {isPending ? "Saving..." : "Save changes"}
                          </button>
                          <button
                            type="button"
                            onClick={stopEditing}
                            disabled={isPending}
                            className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#b4b9b0] px-4 text-sm font-semibold text-[#17212b] transition-colors hover:bg-[#eef0eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212b] disabled:opacity-50"
                          >
                            Keep as is
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="mt-5 flex flex-wrap gap-3 border-t border-dashed border-[#b4b9b0] pt-5">
                        <button
                          type="button"
                          onClick={() => startEditing(booking)}
                          disabled={isPending}
                          className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#17212b] px-4 text-sm font-semibold text-[#17212b] transition-colors hover:bg-[#17212b] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212b] disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelBooking(booking)}
                          disabled={isPending}
                          className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#b8322a] px-4 text-sm font-semibold text-[#9c3029] transition-colors hover:bg-[#b8322a] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8322a] disabled:opacity-50"
                        >
                          {isPending ? "Cancelling..." : "Cancel booking"}
                        </button>
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </main>
  );
}
