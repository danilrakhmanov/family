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
  description: "Уютное пространство для двоих",
  openGraph: {
    title: "Наш Дом - Приложение для пар",
    description: "Уютное пространство для двоих",
    type: "website",
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
