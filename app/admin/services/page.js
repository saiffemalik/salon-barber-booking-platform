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
const emptyForm = { name: "", durationMins: "", price: "", description: "" };

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function fetchServices(signal) {
  const response = await fetch("/api/services", { signal });
  const result = await readResponse(response);
  if (!response.ok) throw new Error(result.error || "Unable to load services.");
  return Array.isArray(result.services) ? result.services : [];
}

export default function AdminServicesPage() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialServices() {
      try {
        setServices(await fetchServices(controller.signal));
        setLoadError("");
      } catch (loadFailure) {
        if (loadFailure.name !== "AbortError") {
          setLoadError(
            loadFailure instanceof Error ? loadFailure.message : "Unable to load services.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadInitialServices();
    return () => controller.abort();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
    setError("");
  }

  function startEditing(service) {
    setForm({
      name: service.name,
      durationMins: String(service.durationMins),
      price: String(service.price),
      description: service.description,
    });
    setEditingId(String(service._id));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setPending(true);

    const payload = {
      name: form.name,
      durationMins: Number(form.durationMins),
      price: Number(form.price),
      description: form.description,
    };

    try {
      const response = await fetch(
        editingId ? `/api/services/${editingId}` : "/api/services",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await readResponse(response);
      if (!response.ok) {
        setError(result.issues?.[0]?.message || result.error || "Unable to save this service.");
        return;
      }

      setSuccess(editingId ? "Service updated." : "Service added.");
      resetForm();
      setServices(await fetchServices());
    } catch {
      setError("We couldn't connect. Check your internet connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function deleteService(service) {
    if (!window.confirm(`Delete "${service.name}"? This cannot be undone.`)) return;

    setError("");
    setSuccess("");
    setPending(true);
    try {
      const response = await fetch(`/api/services/${service._id}`, { method: "DELETE" });
      const result = await readResponse(response);
      if (!response.ok) {
        setError(result.error || "Unable to delete this service.");
        return;
      }

      setServices((current) =>
        current.filter((item) => String(item._id) !== String(service._id)),
      );
      if (editingId === String(service._id)) resetForm();
      setSuccess("Service deleted.");
    } catch {
      setError("We couldn't connect. Check your internet connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={`${font.className} flex-1 bg-[#e8eae4] px-4 py-10 text-[#17212b] sm:px-8 lg:py-16`}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#5d6873]">
              Administration
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Manage services
            </h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-[#4d5862]">
              Add, update, or remove the services customers can book.
            </p>
          </div>
          <Link
            href="/admin/bookings"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#17212b] px-5 text-sm font-semibold text-[#17212b] transition-colors hover:bg-[#17212b] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212b]"
          >
            Manage bookings
          </Link>
        </div>

        {loadError ? (
          <p role="alert" className="mt-8 border-l-4 border-[#b8322a] bg-white px-4 py-3 text-sm leading-6">
            {loadError}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-5 border-l-4 border-[#b8322a] bg-white px-4 py-3 text-sm leading-6">
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" aria-live="polite" className="mt-5 border-l-4 border-[#285c38] bg-white px-4 py-3 text-sm leading-6">
            {success}
          </p>
        ) : null}

        <section className="mt-10 border border-[#b4b9b0] bg-[#fbfbf9]">
          <div
            aria-hidden="true"
            className="h-1.5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, #b8322a 0 10px, #fbfbf9 10px 20px, #25406b 20px 30px, #fbfbf9 30px 40px)",
            }}
          />
          <form onSubmit={handleSubmit} className="p-5 sm:p-7" aria-busy={pending}>
            <h2 className="text-xl font-semibold">
              {editingId ? "Edit service" : "Add a service"}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="service-name" className={labelClass}>Name</label>
                <input
                  id="service-name"
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  disabled={pending}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="service-duration" className={labelClass}>Duration (minutes)</label>
                <input
                  id="service-duration"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={form.durationMins}
                  onChange={(event) => setForm((current) => ({ ...current, durationMins: event.target.value }))}
                  disabled={pending}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="service-price" className={labelClass}>Price (€)</label>
                <input
                  id="service-price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  disabled={pending}
                  className={fieldClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="service-description" className={labelClass}>Description</label>
                <textarea
                  id="service-description"
                  rows={3}
                  required
                  maxLength={2000}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  disabled={pending}
                  className={`${fieldClass} py-3`}
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#17212b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#b8322a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212b] disabled:opacity-50"
              >
                {pending ? "Saving..." : editingId ? "Save changes" : "Add service"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={pending}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#b4b9b0] px-5 text-sm font-semibold text-[#17212b] hover:bg-[#eef0eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212b] disabled:opacity-50"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="mt-10" aria-labelledby="services-heading">
          <h2 id="services-heading" className="text-xl font-semibold">Current services</h2>
          {loading ? (
            <p role="status" aria-live="polite" className="mt-5 text-sm text-[#4d5862]">
              Loading services...
            </p>
          ) : services.length === 0 ? (
            <p className="mt-5 border border-[#b4b9b0] bg-[#fbfbf9] p-5 text-sm text-[#4d5862]">
              No services have been added yet.
            </p>
          ) : (
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <li key={service._id} className="border border-[#b4b9b0] bg-[#fbfbf9] p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{service.name}</h3>
                      <p className="mt-1 text-sm text-[#5d6873]">
                        {service.durationMins} minutes · €{Number(service.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#4d5862]">{service.description}</p>
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-dashed border-[#b4b9b0] pt-4">
                    <button
                      type="button"
                      onClick={() => startEditing(service)}
                      disabled={pending}
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#17212b] px-4 text-sm font-semibold text-[#17212b] hover:bg-[#17212b] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212b] disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteService(service)}
                      disabled={pending}
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#b8322a] px-4 text-sm font-semibold text-[#9c3029] hover:bg-[#b8322a] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8322a] disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
