import type { Metadata } from "next";
import { Providers } from "./providers";

const miniapp = {
  version: "1",
  imageUrl: "https://z0afnvbjxg97jpeq.public.blob.vercel-storage.com/embed.png",
  button: {
    title: "join fans club",
    action: {
      type: "launch_miniapp",
      url: "https://airamint.vercel.app/",
      name: "aira chan！",
      splashImageUrl: "https://z0afnvbjxg97jpeq.public.blob.vercel-storage.com/splash.png",
      splashBackgroundColor: "#aa579fff",
    },
  },
} as const;

export const metadata: Metadata = {
  other: {
    "fc:miniapp": JSON.stringify(miniapp),
    "fc:frame": JSON.stringify({
      ...miniapp,
      button: { ...miniapp.button, action: { ...miniapp.button.action, type: "launch_frame" } },
    }),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
