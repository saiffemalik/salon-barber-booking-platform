"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Unable to log out. Please try again.");
      }

      router.replace("/");
      router.refresh();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Unable to log out. Please try again.",
      );
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleLogout}
        disabled={pending}
        className="inline-flex min-h-10 items-center justify-center rounded-full border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Signing out..." : "Log out"}
      </button>
      {error ? (
        <p role="alert" className="max-w-40 text-xs leading-4 text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
