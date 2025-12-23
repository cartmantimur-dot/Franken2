import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Fräulein Franken – Geschenke für dich",
  description: "Warenverwaltung und Rechnungsstellung für Kleingewerbe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={inter.variable}>
      <body className="antialiased min-h-screen">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
