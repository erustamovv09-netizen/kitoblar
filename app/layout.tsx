import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kitoblar Portali | Premium E-Library",
  description: "Eng yaxshi kitoblar to'plami",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
