import type { Metadata } from "next";
import { Manrope, Playfair_Display, Amiri } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/reader/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "аль-Фаваид · многослойная читалка",
  description:
    "Интерактивное чтение книги Ибн Каййима аль-Джаузиййи «аль-Фаваид»: один текст — три слоя восприятия. Книга, разбор и атлас с таблицами, шкалами и примерами из XXI века.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${playfair.variable} ${amiri.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
