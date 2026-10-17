import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salon & Barber Booking",
  description: "Book salon and barber appointments online",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Suspense
          fallback={
            <header className="min-h-16 border-b border-stone-200 bg-[#fbfaf7]" aria-hidden="true" />
          }
        >
          <Navbar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
