import type { Metadata } from "next";
import localFont from "next/font/local";
import { Poppins } from "next/font/google";
import "./globals.css";

/**
 * KG Blank Space Solid — display / headline font.
 * Downloaded from DaFont (free for personal / educational use).
 * Stored in public/fonts/ and loaded via next/font/local for zero-layout-shift.
 */
const kgBlankSpaceSolid = localFont({
  src: "../public/fonts/KGBlankSpaceSolid.ttf",
  variable: "--font-display",
  display: "swap",
  weight: "400",
});

/**
 * Poppins — body / UI label font.
 * Loaded from Google Fonts via next/font/google.
 */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GetCalmer — Jadi Pahlawan Literasi Media Digital",
  description:
    "Simulasi feed video edukatif untuk melatih literasi AI dan deteksi hoaks pada anak-anak.",
  keywords: ["literasi AI", "deteksi hoaks", "edukasi anak", "ThinkTok"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${kgBlankSpaceSolid.variable} ${poppins.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
