import type { Metadata } from "next";
import { Sarabun, Outfit } from "next/font/google";
import "../index.css"; // We have the CSS from Vite in src/index.css

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "ICSN Panda Playgroup",
  description: "Playgroup Class Booking for ICSN Panda",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} ${outfit.variable} font-sans antialiased bg-[#f8fafc]`}>
        {children}
      </body>
    </html>
  );
}
