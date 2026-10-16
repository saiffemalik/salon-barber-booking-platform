import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearAuthCookie();
    return Response.json({ success: true });
  } catch (error) {
    console.error("Logout route failed:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
