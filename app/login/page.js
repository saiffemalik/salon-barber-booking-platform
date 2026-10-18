"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to log in. Please try again.");
        setPending(false);
        return;
      }

      router.replace(result.user?.role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setError("We couldn't connect. Check your internet connection and try again.");
      setPending(false);
    }
  }

  return (
    <main
      className="relative isolate flex flex-1 flex-col items-center justify-center bg-slate-900 bg-cover bg-center px-4 py-12 sm:px-6"
      style={{ backgroundImage: "url('/barbershop-background.jpg')" }}
    >
      <div className="absolute inset-0 -z-10 bg-[#171411]/55" aria-hidden="true" />
      <div className="mb-6 flex items-center gap-3 text-white">
        <Image
          src="/barber-shop.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 rounded-md bg-white object-contain p-0.5"
        />
        <span className="text-xl font-semibold tracking-tight">Old Town Barbers</span>
      </div>

      <section className="w-full max-w-md rounded-lg border border-[#b89a72]/40 bg-[#211d19]/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Log in to your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#d6caba]">
            Sign in to manage your appointments and bookings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" aria-busy={pending}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-white">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              className="min-h-12 w-full rounded-md border border-[#655747] bg-[#332c24] px-4 text-base text-[#fffaf2] outline-none transition placeholder:text-[#b7a994] focus:border-[#d19a58] focus:ring-2 focus:ring-[#d19a58]/30"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-white">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="min-h-12 w-full rounded-md border border-[#655747] bg-[#332c24] px-4 pr-12 text-base text-[#fffaf2] outline-none transition placeholder:text-[#b7a994] focus:border-[#d19a58] focus:ring-2 focus:ring-[#d19a58]/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-md text-[#d6caba] transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#d19a58]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  {showPassword ? (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.3 4.5 9 7-.2.8-.8 1.8-1.7 2.8" />
                      <path d="M6.2 6.2C3.8 7.7 2.4 10 2 12c.7 2.5 4 7 10 7 1.4 0 2.6-.3 3.7-.8" />
                    </>
                  ) : (
                    <>
                      <path d="M2 12s3.3-7 10-7 10 7 10 7-3.3 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <p
            id="form-message"
            role={error ? "alert" : "status"}
            aria-live={error ? "assertive" : "polite"}
            className={`min-h-5 text-sm ${error ? "text-red-300" : "text-[#d6caba]"}`}
          >
            {error || (pending ? "Signing you in..." : "")}
          </p>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#b8793e] px-5 text-sm font-semibold text-white transition hover:bg-[#a56832] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0ad70] disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#d6caba]">
          New here?{" "}
          <Link
            href="/register"
            className="font-medium text-[#e0ad70] underline decoration-[#e0ad70]/50 underline-offset-4 hover:text-[#f0c58f] hover:decoration-[#f0c58f] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0ad70]"
          >
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
