"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const statuses = ["pending", "confirmed", "cancelled"];

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function fetchBookings(signal) {
  const response = await fetch("/api/bookings", { signal });
  const result = await readResponse(response);
  if (!response.ok) throw new Error(result.error || "Unable to load bookings.");
  return Array.isArray(result.bookings) ? result.bookings : [];
}

function formatDate(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-IE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function statusClass(status) {
  if (status === "confirmed") return "bg-[#e4eee6] text-[#285c38]";
  if (status === "cancelled") return "bg-[#f5e6e3] text-[#8b3029]";
  return "bg-[#f4eedc] text-[#745a17]";
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingId, setPendingId] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialBookings() {
      try {
        setBookings(await fetchBookings(controller.signal));
        setLoadError("");
      } catch (error) {
        if (error.name !== "AbortError") {
          setLoadError(error instanceof Error ? error.message : "Unable to load bookings.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadInitialBookings();
    return () => controller.abort();
  }, []);

  async function updateStatus(booking, status) {
    if (status === booking.status) return;

    setActionError("");
    setSuccess("");
    setPendingId(String(booking._id));

    try {
      const response = await fetch(`/api/bookings/${booking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await readResponse(response);
      if (!response.ok) {
        setActionError(result.error || "Unable to update booking status.");
        return;
      }

      setBookings((current) =>
        current.map((item) =>
          String(item._id) === String(booking._id)
            ? { ...item, ...result.booking, user: item.user }
            : item,
        ),
      );
      setSuccess("Booking status updated.");
    } catch {
      setActionError("We couldn't connect. Check your internet connection and try again.");
    } finally {
      setPendingId("");
    }
  }

  return (
    <main className="flex-1 bg-[#e8eae4] px-4 py-10 text-[#17212b] sm:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#5d6873]">
              Administration
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Manage bookings
            </h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-[#4d5862]">
              Review appointments and update their status.
            </p>
          </div>
          <Link
            href="/admin/services"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#17212b] px-5 text-sm font-semibold text-[#17212b] transition-colors hover:bg-[#17212b] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212b]"
          >
            Manage services
          </Link>
        </div>

        {actionError ? (
          <p role="alert" className="mt-8 border-l-4 border-[#b8322a] bg-white px-4 py-3 text-sm leading-6">
            {actionError}
          </p>
        ) : null}
        {success ? (
          <p role="status" aria-live="polite" className="mt-5 border-l-4 border-[#285c38] bg-white px-4 py-3 text-sm leading-6">
            {success}
          </p>
        ) : null}

        {loading ? (
          <p role="status" aria-live="polite" className="mt-10 text-sm text-[#4d5862]">
            Loading bookings...
          </p>
        ) : null}
        {!loading && loadError ? (
          <p role="alert" className="mt-10 border-l-4 border-[#b8322a] bg-white px-4 py-3 text-sm leading-6">
            {loadError}
          </p>
        ) : null}
        {!loading && !loadError && bookings.length === 0 ? (
          <p className="mt-10 border border-[#b4b9b0] bg-[#fbfbf9] p-6 text-sm text-[#4d5862]">
            There are no bookings yet.
          </p>
        ) : null}

        {!loading && !loadError && bookings.length > 0 ? (
          <div className="mt-10 overflow-x-auto border border-[#b4b9b0] bg-[#fbfbf9]">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <caption className="sr-only">All customer bookings</caption>
              <thead className="bg-[#17212b] text-white">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Service</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Time</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Notes</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d8dbd3]">
                {bookings.map((booking) => {
                  const id = String(booking._id);
                  const isPending = pendingId === id;
                  const customer =
                    booking.user && typeof booking.user === "object"
                      ? booking.user
                      : null;

                  return (
                    <tr key={id} className="align-top even:bg-[#f3f4f0]">
                      <td className="px-4 py-4">
                        <span className="block font-medium text-[#17212b]">
                          {customer?.name || "Customer"}
                        </span>
                        {customer?.email ? (
                          <span className="mt-1 block text-xs text-[#5d6873]">
                            {customer.email}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 font-medium">
                        {booking.service?.name || "Service unavailable"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">{formatDate(booking.date)}</td>
                      <td className="whitespace-nowrap px-4 py-4 tabular-nums">
                        {booking.time || "—"}
                      </td>
                      <td className="max-w-56 px-4 py-4 text-[#4d5862]">
                        {booking.notes || "—"}
                      </td>
                      <td className="px-4 py-4">
                        <label className="sr-only" htmlFor={`status-${id}`}>
                          Status for {customer?.name || "customer"} — {booking.service?.name || "booking"}
                        </label>
                        <select
                          id={`status-${id}`}
                          value={booking.status || "pending"}
                          onChange={(event) => updateStatus(booking, event.target.value)}
                          disabled={isPending}
                          className={`min-h-10 rounded-md border border-[#b4b9b0] px-2.5 text-sm font-semibold capitalize outline-none focus-visible:ring-2 focus-visible:ring-[#17212b]/25 disabled:opacity-60 ${statusClass(booking.status)}`}
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </main>
  );
}
