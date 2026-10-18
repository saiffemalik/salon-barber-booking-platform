import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-stone-200 bg-[#fbfaf7]">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded text-lg font-bold tracking-tight text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-800"
        >
          <Image
            src="/barber-shop.png"
            alt=""
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-sm object-contain"
          />
          Old Town Barbers
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          {user ? (
            <>
              {user.role === "admin" ? (
                <Link
                  href="/admin"
                  className="rounded px-2 py-2 text-sm font-medium text-stone-700 transition hover:text-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
                >
                  Admin
                </Link>
              ) : null}
              <Link
                href="/dashboard"
                className="rounded px-2 py-2 text-sm font-medium text-stone-700 transition hover:text-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
              >
                Dashboard
              </Link>
              <Link
                href="/book"
                className="rounded px-2 py-2 text-sm font-medium text-stone-700 transition hover:text-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
              >
                Book
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded px-2 py-2 text-sm font-medium text-stone-700 transition hover:text-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
