import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "MedLens AI",
  description:
    "AI-powered patient history reconstruction and clinical decision support platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#F8FAFC] text-[#0F172A]">
        <Navbar />
        {children}
      </body>
    </html>
  );
}