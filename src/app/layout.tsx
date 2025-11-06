// app/layout.tsx
import type { ReactNode } from "react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://mint-u.vercel.app";

// ✅ 按官方规范准备 Mini App Embed JSON（详见文档）
const MINIAPP = {
  version: "1",
  imageUrl: `${SITE}/og.png`, // 3:2 推荐 1200×800 或 1500×1000
  button: {
    title: "Mint U",
    action: {
      type: "launch_miniapp",
      url: SITE,
    },
  },
  // 可选：启动时的闪屏图与背景色
  splashImageUrl: `${SITE}/icon-200.png`, // 建议 200×200 PNG
  splashBackgroundColor: "#000000",
};

// 旧客户端的回退（不加也行，加了更稳）
const FRAME_FALLBACK = {
  version: "next",
  imageUrl: `${SITE}/og.png`,
  button: {
    title: "Open",
    action: {
      type: "launch_frame",
      name: "Mint U",
      url: SITE,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        {/* ✅ Farcaster Mini App Embed（关键！没有它就不会出卡片） */}
        <meta name="fc:miniapp" content={JSON.stringify(MINIAPP)} />

        {/* ↩️ 回退：兼容较旧版本客户端 */}
        <meta name="fc:frame" content={JSON.stringify(FRAME_FALLBACK)} />

        {/* 常规 OpenGraph / Twitter 预览（非必须，但强烈建议） */}
        <meta property="og:title" content="Mint U — Base NFT Mini App" />
        <meta
          property="og:description"
          content="一键在 Base 铸造 NFT，并分享到 Farcaster。"
        />
        <meta property="og:image" content={`${SITE}/og.png`} />
        <meta property="og:url" content={SITE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${SITE}/og.png`} />
        <meta name="twitter:title" content="Mint U — Base NFT Mini App" />
        <meta
          name="twitter:description"
          content="一键在 Base 铸造 NFT，并分享到 Farcaster。"
        />

        {/* Favicon / Splash 资源（自行放在 public/ 下） */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
