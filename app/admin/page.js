import Link from "next/link";

const sections = [
  {
    href: "/admin/bookings",
    title: "Manage bookings",
    description: "Review customer appointments and update their booking status.",
    action: "View bookings",
  },
  {
    href: "/admin/services",
    title: "Manage services",
    description: "Add, edit, and remove the services available for booking.",
    action: "View services",
  },
];

export default function AdminPage() {
  return (
    <main className="flex-1 bg-[#e8eae4] px-4 py-10 text-[#17212b] sm:px-8 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#5d6873]">
          Old Town Barbers
        </p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Admin dashboard
        </h1>
        <p className="mt-3 max-w-lg text-base leading-7 text-[#4d5862]">
          Manage appointments and keep your service list up to date.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <section
              key={section.href}
              className="border border-[#b4b9b0] bg-[#fbfbf9] p-6 sm:p-8"
            >
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-3 min-h-12 text-sm leading-6 text-[#4d5862]">
                {section.description}
              </p>
              <Link
                href={section.href}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-[#17212b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#b8322a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212b]"
              >
                {section.action}
              </Link>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
