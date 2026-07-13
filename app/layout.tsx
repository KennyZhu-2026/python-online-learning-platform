import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  return {
    metadataBase,
    title: "Python 小芽｜打开浏览器学 Python",
    description: "为孩子设计的在线 Python 学习空间，无需安装，打开浏览器即可写代码、运行和闯关。",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "Python 小芽｜打开浏览器学 Python",
      description: "一边闯关，一边写下自己的第一段 Python 程序。",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Python 小芽在线学习平台" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Python 小芽｜打开浏览器学 Python",
      description: "无需安装，打开浏览器就能学 Python。",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
