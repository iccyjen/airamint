// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Mint U — Base NFT Mini App",
  description: "Mint U！在 Base 链一键铸造，并分享到 Farcaster。",
  openGraph: {
    title: "Mint U — Base NFT Mini App",
    description: "Mint U！在 Base 链一键铸造，并分享到 Farcaster。",
    images: ["/og.png"], // 建议在 public/ 下放一个 og.png
    url: process.env.NEXT_PUBLIC_SITE || undefined,
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
    title: "Mint U — Base NFT Mini App",
    description: "Mint U！在 Base 链一键铸造，并分享到 Farcaster。",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Farcaster Mini App 元信息（可选，但有助于卡片展示）
  const miniapp = {
    buttons: [
      {
        title: "Open Mini App",
        action: {
          type: "launch_mini_app",
          name: "Mint U",
          url: process.env.NEXT_PUBLIC_SITE || "",
        },
      },
    ],
  };

  return (
    <html lang="zh-CN">
      <head>
        {/* Farcaster Mini App meta */}
        <meta name="fc:miniapp" content={JSON.stringify(miniapp)} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
