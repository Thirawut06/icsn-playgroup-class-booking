import type { Metadata } from "next";
import { Sarabun, Outfit } from "next/font/google";
import "../index.css";
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "ICSN Panda Playgroup",
  description: "Playgroup Class Booking for ICSN Panda",
};

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} ${outfit.variable} font-sans antialiased bg-icsn-bg`}>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
