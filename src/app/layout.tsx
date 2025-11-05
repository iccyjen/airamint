// src/app/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Providers } from "./providers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Mint U — Base NFT Mini App",
  description: "Mint U！在 Base 链一键铸造，并分享到 Farcaster。",
  openGraph: {
    title: "Mint U — Base NFT Mini App",
    description: "Mint U！在 Base 链一键铸造，并分享到 Farcaster。",
    images: ["/og.png"], // 没有也没关系，不会阻塞渲染
  },
  twitter: {
    card: "summary_large_image",
    title: "Mint U — Base NFT Mini App",
    description: "Mint U！在 Base 链一键铸造，并分享到 Farcaster。",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
