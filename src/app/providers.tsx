"use client";

import { ReactNode } from "react";
import { WagmiProvider, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createThirdwebClient } from "thirdweb";

// 导出给 <ClaimButton client={client} /> 使用
export const client = createThirdwebClient({
  // 确保已在 Vercel 环境变量里配置 NEXT_PUBLIC_THIRDWEB_CLIENT_ID
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// 极简 wagmi 配置（Base 主网）
const config = createConfig({
  chains: [base],
  transports: { [base.id]: http("https://mainnet.base.org") },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
