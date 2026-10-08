import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fluense Pharma | Pharmaceutical Products",
  description:
    "Browse Fluense Pharma products and current service regions, or contact our team for availability and information.",
  openGraph: {
    title: "Fluense Pharma | Pharmaceutical Products",
    description:
      "Browse Fluense Pharma products and current service regions, or contact our team for availability and information.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
