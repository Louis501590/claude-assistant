import type { Metadata, Viewport } from "next";
import "./globals.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Claude Assistant",
  description: "Persönlicher KI-Assistent",
  manifest: `${base}/manifest.webmanifest`,
  applicationName: "Claude",
  appleWebApp: { capable: true, title: "Claude", statusBarStyle: "black-translucent" },
  icons: {
    icon: `${base}/icons/icon-192.png`,
    apple: `${base}/icons/apple-touch-icon.png`,
  },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#050816",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="font-sans">{children}</body>
    </html>
  );
}
