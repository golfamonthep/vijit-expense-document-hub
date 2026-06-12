import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vijit Expense Document Hub",
  description: "Document-first accounting workflow for Vijit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
