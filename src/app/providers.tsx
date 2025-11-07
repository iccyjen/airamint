"use client";

import { ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useReconnect } from "wagmi";
import { config } from "../wagmi";
import { sdk } from "@farcaster/miniapp-sdk";
import { ThirdwebProvider } from "thirdweb/react"; // v5: 仅负责注入 React Query

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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <ThirdwebProvider>
          <AutoReconnect />
          {children}
        </ThirdwebProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
