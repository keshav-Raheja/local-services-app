import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import ConditionalFooter from "../components/ConditionalFooter";
import { Toaster } from "../components/Toast";

export const metadata: Metadata = {
  title: "SevaHub — India's Trusted Local Services Marketplace",
  description:
    "Connect directly with verified local tradespeople, electricians, plumbers, AC technicians, painters, and technical specialists across Indian cities. Transparent pricing, honest ratings.",
  keywords:
    "local services india, electrician, plumber, ac repair, home tutor, cleaner, painter, local technicians, verified tradespeople",
  openGraph: {
    title: "SevaHub — Local Services at Your Doorstep",
    description: "Verified local electricians, plumbers, and home service experts in your Indian metro.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1 }}>{children}</main>
        <ConditionalFooter />
        <Toaster />
      </body>
    </html>
  );
}
