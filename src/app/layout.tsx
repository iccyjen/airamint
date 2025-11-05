// src/app/layout.tsx
import type { ReactNode } from "react";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://mint-u.vercel.app";

// ✅ 嵌入卡片用的 3:2 图片（建议 1200x800 PNG/JPG）
const EMBED_IMG = `${SITE}/embed.png`;

// ✅ Splash 小图标（200x200 PNG，无透明背景最佳）
const SPLASH_IMG = `${SITE}/splash.png`;

const miniappEmbed = {
  version: "1",
  imageUrl: EMBED_IMG,
  button: {
    title: "Mint U",
    action: {
      type: "launch_frame",
      name: "Mint U",
      url: SITE,
      splashImageUrl: SPLASH_IMG,
      splashBackgroundColor: "#0b0f19",
    },
  },
};

export const dynamic = "force-static"; // 不要写成对象，避免 revalidate 报错

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Farcaster Mini App Embed（必须） */}
        <meta name="fc:miniapp" content={JSON.stringify(miniappEmbed)} />

        {/* 兼容旧客户端（可选，但推荐） */}
        <meta name="fc:frame" content={JSON.stringify(miniappEmbed)} />

        {/* 常规 OG / Twitter 预览（可选） */}
        <meta property="og:title" content="Mint U — Base NFT Mini App" />
        <meta
          property="og:description"
          content="Mint U！在 Base 链一键铸造，并分享到 Farcaster。"
        />
        <meta property="og:image" content={`${SITE}/og.png`} />
        <meta property="og:url" content={SITE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${SITE}/og.png`} />
      </head>
      <body>{children}</body>
    </html>
  );
}
