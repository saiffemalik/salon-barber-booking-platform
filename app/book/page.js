"use client";

import { useEffect, useState } from "react";

const money = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDay(dateString) {
  if (!dateString) return "";
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function addMinutes(time, mins) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + Number(mins || 0);
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

const fieldClass =
  "min-h-12 w-full rounded-md border border-[#b4b9b0] bg-white px-3.5 text-base text-[#17212b] outline-none transition-colors focus:border-[#17212b] focus-visible:ring-2 focus-visible:ring-[#17212b]/25 disabled:cursor-not-allowed disabled:bg-[#eef0eb] disabled:text-[#7b837c]";

const labelClass = "mb-1.5 block text-sm font-medium text-[#17212b]";

export default function BookPage() {
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [minDate, setMinDate] = useState("");

  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadServices() {
      try {
        const response = await fetch("/api/services", { signal: controller.signal });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load services.");
        }

        setServices(Array.isArray(result.services) ? result.services : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          setServicesError(
            error instanceof Error
              ? error.message
              : "Unable to load services. Please try again.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setMinDate(getLocalDateString());
          setServicesLoading(false);
        }
      }
    }

    loadServices();
    return () => controller.abort();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    setSuccess("");
    setPending(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, date, time }),
      });
      const result = await response.json();

      if (!response.ok) {
        const issueMessage = result.issues?.[0]?.message;
        setSubmitError(issueMessage || result.error || "Unable to create your booking.");
        return;
      }

      const serviceName = result.booking?.service?.name;
      setSuccess(
        `Request sent${serviceName ? ` for ${serviceName}` : ""} on ${formatDay(date)} at ${time}.`,
      );
      setServiceId("");
      setDate("");
      setTime("");
    } catch {
      setSubmitError("We couldn't connect. Check your internet connection and try again.");
    } finally {
      setPending(false);
    }
  }

  const isFormDisabled = servicesLoading || services.length === 0 || pending;
  const selected = services.find((service) => service._id === serviceId);
  const endTime = selected ? addMinutes(time, selected.durationMins) : "";

  const rows = [
    { label: "Service", value: selected?.name },
    { label: "Day", value: formatDay(date) },
    {
      label: "Time",
      value: time ? (endTime ? `${time} to ${endTime}` : time) : "",
    },
  ];

  return (
    <main
      className="flex-1 bg-[#e8eae4] px-4 py-10 text-[#17212b] sm:px-8 lg:py-16"
    >
      <form
        onSubmit={handleSubmit}
        aria-busy={pending || servicesLoading}
        className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-14"
      >
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Book an appointment
          </h1>
          <p className="mt-3 max-w-md text-base leading-7 text-[#4d5862]">
            Choose a service, then a day and time. We&rsquo;ll check it against the
            diary and get back to you.
          </p>

          {servicesError ? (
            <p
              role="alert"
              className="mt-8 border-l-4 border-[#b8322a] bg-white px-4 py-3 text-sm leading-6 text-[#17212b]"
            >
              {servicesError}
            </p>
          ) : null}

          {!servicesLoading && !servicesError && services.length === 0 ? (
            <p
              role="status"
              className="mt-8 border-l-4 border-[#7b837c] bg-white px-4 py-3 text-sm leading-6"
            >
              There are no services to book right now. Check back later.
            </p>
          ) : null}

          {success ? (
            <p
              role="status"
              aria-live="polite"
              className="mt-8 border-l-4 border-[#17212b] bg-white px-4 py-3 text-sm leading-6"
            >
              {success}
            </p>
          ) : null}

          <div className="mt-10 space-y-6">
            <div>
              <label htmlFor="serviceId" className={labelClass}>
                Service
              </label>
              <select
                id="serviceId"
                name="serviceId"
                required
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                disabled={isFormDisabled}
                className={fieldClass}
              >
                <option value="" disabled>
                  {servicesLoading ? "Loading services..." : "Select a service"}
                </option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name} ({service.durationMins} min, {money.format(Number(service.price))})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="date" className={labelClass}>
                  Date
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  min={minDate}
                  required
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  disabled={isFormDisabled}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="time" className={labelClass}>
                  Start time
                </label>
                <input
                  id="time"
                  name="time"
                  type="time"
                  required
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  disabled={isFormDisabled}
                  className={fieldClass}
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="border border-[#b4b9b0] bg-[#fbfbf9] lg:sticky lg:top-10">
          <div
            aria-hidden="true"
            className="h-2"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, #b8322a 0 10px, #fbfbf9 10px 20px, #25406b 20px 30px, #fbfbf9 30px 40px)",
            }}
          />
          <div className="p-6">
            <h2 className="text-lg font-semibold">Your appointment</h2>

            <dl className="mt-4 divide-y divide-dashed divide-[#b4b9b0]">
              {rows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-sm text-[#5d6873]">{row.label}</dt>
                  <dd
                    className={`text-right text-sm tabular-nums ${
                      row.value ? "font-medium text-[#17212b]" : "text-[#8a9199]"
                    }`}
                  >
                    {row.value || "Not chosen yet"}
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 pt-4">
                <dt className="text-sm text-[#5d6873]">Total</dt>
                <dd className="text-2xl font-bold tabular-nums">
                  {selected ? money.format(Number(selected.price)) : "\u2013"}
                </dd>
              </div>
            </dl>

            <p
              role={submitError ? "alert" : "status"}
              aria-live={submitError ? "assertive" : "polite"}
              className={`mt-5 min-h-5 text-sm leading-5 ${
                submitError ? "text-[#a02720]" : "text-[#5d6873]"
              }`}
            >
              {submitError || (pending ? "Sending your request..." : "")}
            </p>

            <button
              type="submit"
              disabled={isFormDisabled}
              className="mt-2 min-h-12 w-full rounded-md bg-[#17212b] px-5 text-base font-semibold text-white transition-colors hover:bg-[#b8322a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212b] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#17212b]"
            >
              {pending ? "Sending..." : "Request appointment"}
            </button>
          </div>
        </aside>
      </form>
    </main>
  );
}