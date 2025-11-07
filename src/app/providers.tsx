import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  // 关掉多注入钱包自动发现，避免一长串重复注入按钮
  multiInjectedProviderDiscovery: false,
  // 连接器顺序：先 Farcaster MiniApp，再浏览器注入（MetaMask/Rabby/OKX 等）
  connectors: [
    miniAppConnector(),
    injected({ shimDisconnect: true }),
  ],
});

// 让 TS 能推断 hooks 的 config 类型（可选）
declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
