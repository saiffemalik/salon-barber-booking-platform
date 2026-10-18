import type { Metadata } from "next";
import { Cormorant_Garamond, Libre_Baskerville } from "next/font/google";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import "./globals.css";

const bodyFont = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
});

const headingFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant-garamond",
});

export const metadata: Metadata = {
  title: "Old Town Barbers",
  description: "Book salon and barber appointments online at Old Town Barbers.",
  icons: {
    icon: "/barber-shop.png",
    apple: "/barber-shop.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}
    >
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
