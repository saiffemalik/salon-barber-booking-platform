"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        const issueMessage = result.issues?.[0]?.message;
        setError(issueMessage || result.error || "Unable to create your account. Please try again.");
        setPending(false);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("We couldn't connect. Check your internet connection and try again.");
      setPending(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-[#f5f3ee] px-4 py-12 sm:px-6">
      <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-9">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-amber-800">
            Your next appointment
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Create your account
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Sign up to book and keep track of your appointments.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" aria-busy={pending}>
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold text-stone-800">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={1}
              maxLength={100}
              className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-stone-800">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-stone-800">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20"
              aria-describedby="password-hint"
            />
            <p id="password-hint" className="mt-2 text-xs leading-5 text-stone-500">
              Use at least 8 characters.
            </p>
          </div>

          <p
            id="form-message"
            role={error ? "alert" : "status"}
            aria-live={error ? "assertive" : "polite"}
            className={`min-h-5 text-sm ${error ? "text-red-700" : "text-stone-500"}`}
          >
            {error || (pending ? "Creating your account..." : "")}
          </p>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-stone-900 px-5 text-base font-semibold text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-stone-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-amber-900 underline decoration-amber-900/40 underline-offset-4 hover:decoration-amber-900 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
          >
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
