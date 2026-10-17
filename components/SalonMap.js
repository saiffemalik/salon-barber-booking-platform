"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center bg-[#eef0eb] text-sm text-[#4d5862]">
      Loading map...
    </div>
  ),
});

export default function SalonMap({ address }) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function geocodeAddress() {
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`, {
          signal: controller.signal,
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load the salon location.");
        }

        setLocation(result);
      } catch (lookupError) {
        if (lookupError.name !== "AbortError") {
          setError(
            lookupError instanceof Error
              ? lookupError.message
              : "Unable to load the salon location.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    geocodeAddress();
    return () => controller.abort();
  }, [address]);

  return (
    <section
      aria-labelledby="salon-location-heading"
      className="mx-auto mt-12 w-full max-w-4xl border border-[#b4b9b0] bg-[#fbfbf9]"
    >
      <div className="p-5 sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d6873]">
          Find us
        </p>
        <h2 id="salon-location-heading" className="mt-1 text-2xl font-semibold">
          The Groom Room
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#4d5862]">{address}</p>
      </div>

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="flex h-72 items-center justify-center bg-[#eef0eb] text-sm text-[#4d5862]"
        >
          Finding the salon on the map...
        </div>
      ) : error ? (
        <p role="alert" className="border-t border-[#b4b9b0] bg-white px-5 py-4 text-sm text-[#9c3029]">
          {error}
        </p>
      ) : location ? (
        <>
          <div
            id="salon-map"
            className="relative isolate h-72 w-full overflow-hidden border-t border-[#b4b9b0] sm:h-96"
          >
            <LeafletMap location={location} />
          </div>
          <p className="px-5 py-3 text-xs leading-5 text-[#5d6873]">
            Map data &copy; OpenStreetMap contributors.
          </p>
        </>
      ) : null}
    </section>
  );
}
