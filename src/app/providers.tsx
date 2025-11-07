"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useReconnect } from "wagmi";
import { config } from "../wagmi";
import { ThirdwebProvider } from "thirdweb/react";
import { sdk } from "@farcaster/miniapp-sdk";

const queryClient = new QueryClient();

function AutoReconnect() {
  const { reconnect } = useReconnect();
  useEffect(() => {
    (async () => {
      try { await sdk.actions.ready(); } catch {}
      reconnect(); // Mini App 环境里触发一次重连
    })();
  }, [reconnect]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        {/* thirdweb v5：这里只做 React Query 注入 */}
        <ThirdwebProvider>
          <AutoReconnect />
          {children}
        </ThirdwebProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

// 额外再导出默认，避免有人用 default 导入
export default Providers;
