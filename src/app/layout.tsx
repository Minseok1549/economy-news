import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "업코노미 | 경제 뉴스 요약",
  description: "글로벌 뉴스 한눈에 보기, 요약된 경제 뉴스 제공 | Daily Global Economy News",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-semibold text-gray-900">UPCO</h1>
              </div>
            </div>
          </div>
        </header>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
