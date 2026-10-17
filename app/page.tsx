import Link from "next/link";
import { connectDB } from "@/lib/db";
import Service from "@/models/Service";

export const dynamic = "force-dynamic";

export default async function Home() {
  let services = [];
  let servicesUnavailable = false;

  try {
    await connectDB();
    services = await Service.find().sort({ name: 1 }).lean();
  } catch (error) {
    console.error("Unable to load salon services:", error);
    servicesUnavailable = true;
  }

  return (
    <main className="flex-1 bg-white text-stone-900">
      <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-8 sm:py-24">
        <section className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Book your next haircut online
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
            Find a service that suits you and choose a time that works for your
            next visit.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/book"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700"
            >
              Book an appointment
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Log in
            </Link>
          </div>
        </section>

        <section className="mt-16 max-w-3xl sm:mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">Our services</h2>
          {servicesUnavailable ? (
            <p className="mt-5 rounded-md border border-stone-200 px-5 py-4 text-stone-600">
              Services are temporarily unavailable.
            </p>
          ) : services.length === 0 ? (
            <p className="mt-5 rounded-md border border-stone-200 px-5 py-4 text-stone-600">
              No services have been added yet.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-stone-200 rounded-md border border-stone-200">
              {services.map((service) => (
                <li
                  key={service._id.toString()}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="mt-1 text-sm text-stone-600">
                      {service.durationMins} minutes
                    </p>
                    {service.description && (
                      <p className="mt-2 text-sm leading-6 text-stone-600">
                        {service.description}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-medium text-stone-800">
                    €{Number(service.price).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
