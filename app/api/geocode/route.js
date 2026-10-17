import { z } from "zod";

const querySchema = z.string().trim().min(2).max(200);
const nominatimResultSchema = z.array(
  z.object({
    lat: z.string(),
    lon: z.string(),
    display_name: z.string().optional(),
  }),
);
const MIN_REQUEST_INTERVAL_MS = 1000;
const NOMINATIM_TIMEOUT_MS = 8000;

function getSearchQueries(address) {
  const withCountry = (value) =>
    /\bIreland\b/i.test(value) ? value : `${value}, Ireland`;
  const withoutUnit = address.replace(/^\s*(?:apartment|apt\.?|unit)\s+[^,]+,\s*/i, "");
  const withoutEircode = (value) =>
    value.replace(/,\s*D\d{2}\s+[A-Z0-9]{4}\s*$/i, "").trim();
  const broadAddress = withoutEircode(withoutUnit)
    .split(",")
    .slice(1)
    .join(",")
    .trim();

  return [...new Set([
    withCountry(address),
    withCountry(withoutUnit),
    broadAddress ? withCountry(broadAddress) : "",
  ].filter(Boolean))];
}

async function waitForNominatimSlot() {
  const now = Date.now();
  const nextAllowedAt = Math.max(
    now,
    globalThis.nominatimNextAllowedAt || now,
  );
  globalThis.nominatimNextAllowedAt = nextAllowedAt + MIN_REQUEST_INTERVAL_MS;

  const delay = nextAllowedAt - now;
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const validation = querySchema.safeParse(searchParams.get("q"));

  if (!validation.success) {
    return Response.json(
      { error: "Provide a location query between 2 and 200 characters." },
      { status: 400 },
    );
  }

  try {
    for (const query of getSearchQueries(validation.data)) {
      const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
      searchUrl.searchParams.set("q", query);
      searchUrl.searchParams.set("format", "jsonv2");
      searchUrl.searchParams.set("limit", "1");

      await waitForNominatimSlot();
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": `SalonBarberBooking/1.0 (${process.env.NOMINATIM_CONTACT || "salon location map"})`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(NOMINATIM_TIMEOUT_MS),
        next: { revalidate: 86400 },
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After") || "1";
        return Response.json(
          { error: "Location lookup is temporarily rate limited. Please try again shortly." },
          { status: 429, headers: { "Retry-After": retryAfter } },
        );
      }
      if (!response.ok) {
        console.error("Nominatim returned an error:", response.status);
        return Response.json(
          { error: "Location lookup is temporarily unavailable." },
          { status: 502 },
        );
      }

      const result = nominatimResultSchema.safeParse(await response.json());
      if (!result.success) {
        console.error("Nominatim returned an invalid response:", result.error.issues);
        return Response.json(
          { error: "Location lookup returned an invalid response." },
          { status: 502 },
        );
      }

      if (result.data.length > 0) {
        const [location] = result.data;
        const lat = Number(location.lat);
        const lon = Number(location.lon);
        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          lat < -90 ||
          lat > 90 ||
          lon < -180 ||
          lon > 180
        ) {
          console.error("Nominatim returned out-of-range coordinates.");
          return Response.json(
            { error: "Location lookup returned invalid coordinates." },
            { status: 502 },
          );
        }

        return Response.json({
          lat,
          lon,
          displayName: location.display_name || query,
        });
      }
    }

    return Response.json(
      { error: "The salon location could not be found. Try searching for the nearby street or area." },
      { status: 404 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return Response.json({ error: "Location lookup timed out. Please try again." }, { status: 504 });
    }

    console.error("Geocoding route failed:", error);
    return Response.json({ error: "Unable to look up the salon location." }, { status: 502 });
  }
}
