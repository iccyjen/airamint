// src/wagmi.ts
import { createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { http } from "viem";
import { MiniAppWagmiConnector } from "@farcaster/miniapp-wagmi-connector";

export const config = createConfig({
  chains: [base],
  connectors: [new MiniAppWagmiConnector()],
  transports: { [base.id]: http() },
});
