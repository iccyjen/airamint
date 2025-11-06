import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://mint-u.vercel.app";

const MINIAPP = {
  version: "1",
  imageUrl: `${SITE}/og.png`,
  button: {
    title: "Mint U",
    action: { type: "launch_miniapp", url: SITE },
  },
  // ✅ Farcaster 加载页
  splashImageUrl: `${SITE}/icon-200.png`,
  splashBackgroundColor: "#000000",
};

export const metadata: Metadata = {
  title: "Mint U — Base NFT Mini App",
  description: "Mint U！在 Base 链一键铸造，并分享到 Farcaster。",
  openGraph: {
    title: "Mint U — Base NFT Mini App",
    description: "Mint U！在 Base 链一键铸造，并分享到 Farcaster。",
    images: [`${SITE}/og.png`],
    url: SITE,
  },
  twitter: {
    card: "summary_large_image",
    title: "Mint U — Base NFT Mini App",
    description: "Mint U！在 Base 链一键铸造，并分享到 Farcaster。",
    images: [`${SITE}/og.png`],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        {/* ✅ Farcaster Mini App embed */}
        <meta name="fc:miniapp" content={JSON.stringify(MINIAPP)} />
        {/* 兼容旧客户端（可选） */}
        <meta
          name="fc:frame"
          content={JSON.stringify({
            ...MINIAPP,
            button: { ...MINIAPP.button, action: { ...MINIAPP.button.action, type: "launch_frame" } },
          })}
        />
        <link rel="icon" href="/icon-200.png" />
      </head>
      <body>
        {/* ✅ 包上 Providers，运行时就有 WagmiProvider 了 */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
