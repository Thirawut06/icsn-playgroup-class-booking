import type { Metadata } from "next";
import { Sarabun, Outfit } from "next/font/google";
import "../index.css";
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  metadataBase: new URL("https://playgroup.icsn.ac.th"),
  title: "ICSN Panda Playgroup",
  description: "ระบบจองคลาสเรียน ICSN Panda Playgroup - Come Play, Learn and Grow",
  keywords: ["ICSN", "Panda", "Playgroup", "Booking", "Class", "Kids"],
  openGraph: {
    title: "ICSN Panda Playgroup",
    description: "ระบบจองคลาสเรียน ICSN Panda Playgroup - Come Play, Learn and Grow",
    url: "https://playgroup.icsn.ac.th",
    siteName: "ICSN Panda Playgroup",
    images: [
      {
        url: "/playgroup-banner-icsn.png",
        width: 1200,
        height: 630,
        alt: "ICSN Panda Playgroup",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ICSN Panda Playgroup",
    description: "ระบบจองคลาสเรียน ICSN Panda Playgroup - Come Play, Learn and Grow",
    images: ["/playgroup-banner-icsn.png"],
  },
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
        <Analytics />
      </body>
    </html>
  );
}
