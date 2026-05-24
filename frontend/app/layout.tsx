import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import { Toaster } from "../components/Toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "ServiceHub — Home Services at Your Doorstep",
  description:
    "Book trusted local professionals for electricians, plumbers, tutors, laptop repair and more. Fast, reliable, and affordable home services.",
  keywords: "home services, electrician, plumber, tutor, laptop repair, local professionals",
  openGraph: {
    title: "ServiceHub — Home Services at Your Doorstep",
    description: "Book trusted local professionals instantly.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <Navbar />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
