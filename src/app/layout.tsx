import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import { Providers } from "@/components/providers";

const appFont = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-app",
  display: "swap"
});

export const metadata: Metadata = {
  title: "First Pack Fuel Reconciliation",
  description: "Vehicle-based fuel inventory, allocation and reconciliation system."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={appFont.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
