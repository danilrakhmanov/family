import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import TelegramWebAppProvider from "@/components/TelegramWebAppProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Наш Дом - Приложение для пар",
  description: "Уютное пространство для двоих. Делитесь задачами, планируйте вместе и сохраняйте воспоминания в одном красивом месте.",
  openGraph: {
    title: "Наш Дом - Приложение для пар",
    description: "Уютное пространство для двоих. Делитесь задачами, планируйте вместе и сохраняйте воспоминания.",
    type: "website",
    url: "https://ourhome-love.vercel.app",
    siteName: "Наш Дом",
    images: [
      {
        url: "https://ourhome-love.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Наш Дом - Приложение для пар",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} antialiased`}>
        <TelegramWebAppProvider>
          {children}
        </TelegramWebAppProvider>
      </body>
    </html>
  );
}
