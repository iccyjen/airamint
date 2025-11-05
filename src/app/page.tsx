"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance, useConnect } from "wagmi";
import { ClaimButton } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { client } from "./providers";
import { sdk } from "@farcaster/miniapp-sdk";
import { createPublicClient, http } from "viem";
import { base as viemBase } from "viem/chains";

// ⚠️ 换成你的 DropERC721 合约地址
const CONTRACT = "0xb18d766e6316a93B47338F1661a0b9566C16f979";

// 从环境变量读取轮播图片和总量（配置在 Vercel）
const IMG_CID = process.env.NEXT_PUBLIC_IMG_CID;
const IMG_COUNT = Number(process.env.NEXT_PUBLIC_IMG_COUNT ?? "8");
const TOTAL_SUPPLY_FALLBACK = Number(process.env.NEXT_PUBLIC_TOTAL_SUPPLY ?? "100");

// —— 小工具：读取合约上的几个常见“供应/进度”函数，逐个尝试 —— //
const publicClient = createPublicClient({
  chain: viemBase,
  transport: http("https://mainnet.base.org"),
});

async function tryReadUint(fn: string) {
  try {
    const out = await publicClient.readContract({
      address: CONTRACT as `0x${string}`,
      abi: [
        {
          name: fn,
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ type: "uint256", name: "" }],
        } as const,
      ],
      functionName: fn as any,
    });
    return BigInt(out as any);
  } catch {
    return null;
  }
}

async function fetchMintProgress() {
  // minted 优先：totalMinted -> totalSupply -> nextTokenIdToClaim
  const minted =
    (await tryReadUint("totalMinted")) ??
    (await tryReadUint("totalSupply")) ??
    (await tryReadUint("nextTokenIdToClaim")) ??
    0n;

  // total 优先：maxTotalSupply -> maxSupply -> 环境变量
  const total =
    (await tryReadUint("maxTotalSupply")) ??
    (await tryReadUint("maxSupply")) ??
    BigInt(TOTAL_SUPPLY_FALLBACK);

  return { minted: Number(minted), total: Number(total) };
}

// 轮播用：把 IPFS CID 转为 https 网关链接
function makeImgUrls() {
  if (!IMG_CID) return [] as string[];
  // 使用通用网关；你也可以换成 pinata/gateway 自定义域
  return Array.from({ length: IMG_COUNT }, (_, i) => `https://ipfs.io/ipfs/${IMG_CID}/${i + 1}.png`);
}

export default function Home() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: balance } = useBalance({ address, chainId: 8453, watch: true });
  const [txHash, setTxHash] = useState<string | null>(null);

  // 顶部左侧：已铸/总量
  const [{ minted, total }, setProgress] = useState<{ minted: number; total: number }>({
    minted: 0,
    total: TOTAL_SUPPLY_FALLBACK,
  });

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const p = await fetchMintProgress();
        if (!stop) setProgress(p);
      } catch {
        // 忽略读取失败
      }
    })();
    // 每 20 秒自动刷新一次
    const t = setInterval(async () => {
      try {
        const p = await fetchMintProgress();
        if (!stop) setProgress(p);
      } catch {}
    }, 20000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  // 顶部右侧：Farcaster 头像（拿不到就用地址首字母圈）
  const [pfp, setPfp] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        // 兼容多种 SDK 场景（v0.2 里未稳定公开，容错写法）
        const anySdk: any = sdk as any;
        const ctx =
          (await anySdk?.context?.getCurrentUser?.()) ||
          (await anySdk?.context?.user?.()) ||
          anySdk?.context ||
          {};
        const u = ctx?.user || ctx;
        const url = u?.pfpUrl || u?.pfp_url || u?.avatar_url || null;
        if (url) setPfp(url);
      } catch {
        // ignore
      }
    })();
  }, []);

  // 中间：轮播图片
  const imgs = useMemo(() => makeImgUrls(), []);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!imgs.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % imgs.length), 2500);
    return () => clearInterval(t);
  }, [imgs.length]);

  const appUrl = typeof window !== "undefined" ? window.location.href : undefined;

  return (
    <main
      style={{
        minHeight: "100svh",
        padding: 16,
        background: "linear-gradient(180deg,#c9dcff 0%,#b8d0ff 30%,#a9c7ff 100%)",
      }}
    >
      {/* 顶部条 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 700, color: "#4b6bff" }}>
          {minted}/{total} minted
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {pfp ? (
            <img
              src={pfp}
              width={32}
              height={32}
              style={{ borderRadius: "50%", border: "2px solid #fff", boxShadow: "0 0 0 2px #aab6ff" }}
              alt="pfp"
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#8aa0ff",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {(address ?? "U").slice(2, 3).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* 标题 */}
      <h1
        style={{
          textAlign: "center",
          fontSize: 44,
          lineHeight: 1.05,
          margin: "8px 0 16px",
          background: "linear-gradient(90deg,#b05bff,#ff6ac6)",
          WebkitBackgroundClip: "text",
          color: "transparent",
          fontWeight: 900,
        }}
      >
        Mint U！
      </h1>

      {/* 说明副标题（可改成你的宣发文案） */}
      <p style={{ textAlign: "center", color: "#375", opacity: 0.8, marginBottom: 16 }}>
        your cute onchain companions · generative collection on Base
      </p>

      {/* 主图卡片 */}
      <div
        style={{
          maxWidth: 420,
          margin: "0 auto 16px",
          background: "#bfe6ff",
          borderRadius: 16,
          height: 360,
          display: "grid",
          placeItems: "center",
          boxShadow: "0 10px 20px rgba(85,120,255,.25)",
          border: "1px solid rgba(80,110,255,.3)",
        }}
      >
        {imgs.length ? (
          // 轮播图
          // 为了兼容 Warpcast 内置浏览器，不用复杂库，直接 <img> 轮播
          // 若想加渐隐动画，可再加 CSS 过渡
          <img
            key={idx}
            src={imgs[idx]}
            alt="collection"
            style={{ width: "82%", height: "82%", objectFit: "cover", borderRadius: 12 }}
            onError={(e) => ((e.currentTarget.style.visibility = "hidden"))}
          />
        ) : (
          <div style={{ opacity: 0.6, fontWeight: 600, color: "#557", padding: 12 }}>
            设置 NEXT_PUBLIC_IMG_CID 后这里会轮播展示图片
          </div>
        )}
      </div>

      {/* 两个主按钮：Share / Mint */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 420, margin: "0 auto" }}>
        <button
          onClick={() =>
            sdk.actions.composeCast({
              text: "我刚在 Base 铸了一枚 NFT（0.001 ETH）#MintU",
              ...(appUrl ? { embeds: [appUrl] } : {}),
            })
          }
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: "#4d76ff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            boxShadow: "0 6px 16px rgba(77,118,255,.35)",
          }}
        >
          Share
        </button>

        {isConnected ? (
          <ClaimButton
            client={client}
            chain={base}
            contractAddress={CONTRACT}
            claimParams={{ type: "ERC721", quantity: 1n }}
            onTransactionConfirmed={(tx) => {
              setTxHash(tx.transactionHash);
              const url = typeof window !== "undefined" ? window.location.href : undefined;
              sdk.actions.composeCast({
                text: "我刚在 Base 铸了一枚 NFT（0.001 ETH）#MintU",
                ...(url ? { embeds: [url] } : {}),
              });
            }}
            onError={(e) => alert(`交易失败：${(e as Error).message}`)}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "#6a5cff",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              boxShadow: "0 6px 16px rgba(106,92,255,.35)",
            }}
          >
            Mint
          </ClaimButton>
        ) : (
          // 未连接时，显示连接选择（Farcaster MiniApp 里会出现内置连接器）
          connectors.map((c) => (
            <button
              key={c.id}
              onClick={() => connect({ connector: c })}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: "#6a5cff",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                boxShadow: "0 6px 16px rgba(106,92,255,.35)",
              }}
            >
              连接 {c.name}
            </button>
          ))
        )}
      </div>

      {/* 下方：余额 + 成功提示 */}
      <div style={{ maxWidth: 420, margin: "12px auto 0", textAlign: "center", color: "#334" }}>
        {isConnected ? (
          <p>
            Base 余额：{" "}
            <b>
              {balance ? Number(balance.formatted).toFixed(4) : "--"} {balance?.symbol ?? "ETH"}
            </b>
          </p>
        ) : (
          <p style={{ opacity: 0.8 }}>请先连接钱包（在 Warpcast Mini App 中打开）</p>
        )}

        {txHash && (
          <p style={{ marginTop: 8 }}>
            交易成功：{" "}
            <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">
              查看 Tx
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
