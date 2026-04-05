import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "SORTEA",
  description: "Sistema minimalista para la gestión de sorteos y rifas.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#fafafa] text-zinc-900 antialiased min-h-screen selection:bg-zinc-200`}>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
