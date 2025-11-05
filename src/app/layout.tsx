import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Mint U — Base NFT Mini App",
  description: "Mint U！在 Base 链一键铸造，并分享到 Farcaster。",
  openGraph: {
    title: "Mint U — Base NFT Mini App",
    description: "Mint U！在 Base 链一键铸造，并分享到 Farcaster。",
    images: ["/og.png"], // 确保 public/og.png 存在。没有就先用 /001.png 顶上
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://mint-u.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
    title: "Mint U — Base NFT Mini App",
    description: "Mint U！在 Base 链一键铸造，并分享到 Farcaster。",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
