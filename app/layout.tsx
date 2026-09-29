import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/pwa/service-worker-register";
import InstallPwaPrompt from "@/components/pwa/install-pwa-prompt";

export const metadata: Metadata = {
  title: {
    default: "Kampus Digital SISFOR UISI",
    template: "%s · SISFOR UISI",
  },
  description:
    "Jelajahi Kampus Digital Sistem Informasi UISI, selesaikan tiga misi, dan temukan jalur karier digital yang paling cocok untukmu.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kampus Digital UISI",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e1e24",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
        <ServiceWorkerRegister />
        <InstallPwaPrompt />
      </body>
    </html>
  );
}
