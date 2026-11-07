import type { Metadata, Viewport } from "next";
import { Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

const mincho = Shippori_Mincho_B1({
  weight: ["500", "700", "800"],
  subsets: ["latin"],
  variable: "--font-shippori",
  display: "swap",
  preload: false,
});

const gothic = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-zen-kaku",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "真実を求めて",
  description: "窓も扉もない部屋で目覚めたあなたは、家具が見てきた過去を、その物の視点で追体験する。一人称3D脱出ゲーム。",
  applicationName: "真実を求めて",
};

export const viewport: Viewport = {
  themeColor: "#0a0e14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${mincho.variable} ${gothic.variable}`}>
      <body>{children}</body>
    </html>
  );
}
