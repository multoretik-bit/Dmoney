import type { Metadata, Viewport } from "next";
import { Golos_Text } from "next/font/google";
import "./globals.css";

const golosText = Golos_Text({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "dmoney",
  description: "Advanced Expense & Budget Tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "dmoney",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={golosText.className}>{children}</body>
    </html>
  );
}
