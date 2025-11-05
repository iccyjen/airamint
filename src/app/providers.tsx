"use client";

import { PropsWithChildren, useEffect } from "react";
import { WagmiProvider, useWalletClient } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "../wagmi";
import { sdk } from "@farcaster/miniapp-sdk";

// thirdweb v5
import { ThirdwebProvider, useSetActiveWallet } from "thirdweb/react";
import { createThirdwebClient, getContract } from "thirdweb";
import { EIP1193 } from "thirdweb/wallets";

// ⚠️ 从 Vercel/GitHub 环境变量注入
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
export const client = createThirdwebClient({
  clientId: clientId!,
});

const qc = new QueryClient();

/** 把 wagmi 连接的钱包“喂给” thirdweb，供 ClaimButton 使用 */
function WagmiToThirdwebBridge() {
  const { data: walletClient } = useWalletClient();
  const setActiveWallet = useSetActiveWallet();

  useEffect(() => {
    (async () => {
      if (!walletClient) return;

      // 优先取底层 provider；取不到则用 walletClient 自身做一个 EIP-1193 适配
      const provider =
        (walletClient as any)?.transport?.value?.provider ??
        ({
          request: (args: { method: string; params?: unknown[] }) =>
            (walletClient as any).request(args as any),
        } as any);

      const twWallet = EIP1193.fromProvider({ provider });
      await twWallet.connect({ client });
      setActiveWallet(twWallet);
      // console.log("[thirdweb] active wallet set");
    })();
  }, [walletClient, setActiveWallet]);

  return null;
}

export function Providers({ children }: PropsWithChildren) {
  // Mini App 规范：首屏 ready
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <ThirdwebProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={qc}>
          <WagmiToThirdwebBridge />
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </ThirdwebProvider>
  );
}
