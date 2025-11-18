"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance, useConnect } from "wagmi";
import { ClaimButton } from "thirdweb/react";
// MENGGANTI: thirdweb/chains/base -> thirdweb/chains/sepolia
import { sepolia as thirdwebSepolia } from "thirdweb/chains";
import { createThirdwebClient } from "thirdweb";
import { sdk } from "@farcaster/miniapp-sdk";
// MENGGANTI: viem/chains/base -> viem/chains/sepolia
import { createPublicClient, http, type Address } from "viem";
import { sepolia as viemSepolia } from "viem/chains";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";

// ====================================================================
// ============= PERHATIAN! SEPOLIA CONFIGURATION START =============
// ====================================================================

// MENGGANTI: Ganti alamat kontrak ini dengan alamat kontrak Sepolia Anda
const CONTRACT = "0xf91387e69B21E1914AA5Fc8A40E36C2219cf918c"; 

// FIXED_PFP_URL, IPFS_GATEWAY, IMG_CID, IMG_COUNT, IMG_LIST_RAW, TOTAL_SUPPLY_FALLBACK
// Dibiarkan sama karena ini adalah konfigurasi tampilan, bukan konfigurasi blockchain.

// ====== Konfigurasi Chain ID untuk Sepolia ======
const SEPOLIA_CHAIN_ID = 11155111; // Sepolia Chain ID

// ====================================================================
// ============= PERHATIAN! SEPOLIA CONFIGURATION END =============
// ====================================================================


// ====== Gambar & Konfigurasi Lain (Dibiarkan sama) ======
const FIXED_PFP_URL =
  process.env.NEXT_PUBLIC_PFP_URL ??
  "https://z0afnvbjxg97jpeq.public.blob.vercel-storage.com/46.jpg";

const IPFS_GATEWAY = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io").replace(/\/+$/, "");
const IMG_CID = process.env.NEXT_PUBLIC_IMG_CID;
const IMG_COUNT = Number(process.env.NEXT_PUBLIC_IMG_COUNT ?? "8");
const IMG_LIST_RAW = process.env.NEXT_PUBLIC_IMG_LIST?.split(",").map(s => s.trim()).filter(Boolean) || [];
const TOTAL_SUPPLY_FALLBACK = Number(process.env.NEXT_PUBLIC_TOTAL_SUPPLY ?? "515");

// ====== Chain Reading (Minting progress etc.) ======
const publicClient = createPublicClient({
  // MENGGANTI: viemBase -> viemSepolia
  chain: viemSepolia,
  // MENGGANTI: Base mainnet RPC -> Sepolia RPC (Anda mungkin perlu menggantinya dengan RPC Sepolia yang lebih andal)
  transport: http("https://eth-sepolia.public.blastapi.io"),
});

// Fungsi-fungsi tryReadUint, preferNonZero, fetchMintProgress (Dibiarkan sama)
async function tryReadUint(fn: string) {
  try {
    const out = await publicClient.readContract({
      address: CONTRACT as Address,
      abi: [
        {
          name: fn,
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ type: "uint256", name: "" }],
        },
      ] as const,
      functionName: fn as any,
    });
    return BigInt(out as any);
  } catch {
    return null;
  }
}

function preferNonZero(...vals: Array<bigint | null | undefined>): bigint | null {
  for (const v of vals) if (v != null && v !== 0n) return v;
  return null;
}

async function fetchMintProgress() {
  const mintedBn =
    preferNonZero(
      await tryReadUint("totalMinted"),
      await tryReadUint("totalSupply"),
      await tryReadUint("nextTokenIdToClaim"),
    ) ?? 0n;

  const totalBn =
    preferNonZero(await tryReadUint("maxTotalSupply"), await tryReadUint("maxSupply")) ??
    BigInt(TOTAL_SUPPLY_FALLBACK);

  return { minted: Number(mintedBn), total: Number(totalBn) || TOTAL_SUPPLY_FALLBACK };
}

// Fungsi expandImgUrls (Dibiarkan sama)
function expandImgUrls(): string[] {
  if (IMG_LIST_RAW.length) {
    const urls: string[] = [];
    const isImage = (u: string) => /\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(u);
    for (const item of IMG_LIST_RAW) {
      if (isImage(item)) urls.push(item);
      else {
        const dir = item.replace(/\/+$/, "");
        for (let i = 1; i <= IMG_COUNT; i++) urls.push(`${dir}/${i}.png`);
      }
    }
    return urls;
  }
  if (IMG_CID) {
    return Array.from({ length: IMG_COUNT }, (_, i) => `${IPFS_GATEWAY}/ipfs/${IMG_CID}/${i + 1}.png`);
  }
  return [];
}

export default function HomeClient() {
  // Global error listeners and MiniApp ready (Dibiarkan sama)
  useEffect(() => {
    const onErr = (e: ErrorEvent) => console.error("GlobalError:", e.message, e.error);
    const onRej = (e: PromiseRejectionEvent) => console.error("UnhandledRejection:", e.reason);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  useEffect(() => {
    sdk.actions.ready().catch(() => {});
  }, []);

  // Account & Connect (Dibiarkan sama)
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const [connectErr, setConnectErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      // @ts-ignore
      console.log("Wagmi connectors:", connectors.map(c => ({ id: c.id, name: c.name })));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fcFallback = useMemo(() => {
    try {
      return miniAppConnector();
    } catch {
      return undefined;
    }
  }, []);

  const farcasterConnector = useMemo(() => {
    const found = connectors.find(
      (c) =>
        /farcaster|warp/i.test(c.name) ||
        c.id === "farcaster" ||
        c.id === "farcasterMiniApp"
    );
    return found ?? fcFallback;
  }, [connectors, fcFallback]);

  useEffect(() => {
    (async () => {
      try { await sdk.actions.ready(); } catch {}
      if (!isConnected && farcasterConnector) {
        try {
          await connect({ connector: farcasterConnector });
          setConnectErr(null);
        } catch (e: any) {
          setConnectErr(e?.message || String(e));
          console.warn("auto-connect Farcaster failed:", e);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farcasterConnector]);

  // thirdweb client (Dibiarkan sama)
  const client = useMemo(() => {
    const id = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
    if (!id) {
      console.warn("Missing NEXT_PUBLIC_THIRDWEB_CLIENT_ID");
      return null;
    }
    try {
      return createThirdwebClient({ clientId: id });
    } catch (e) {
      console.error("thirdweb client init failed:", e);
      return null;
    }
  }, []);

  // Balance
  const { data: balance } = useBalance({
    address,
    // MENGGANTI: Base Chain ID (8453) -> Sepolia Chain ID (11155111)
    chainId: SEPOLIA_CHAIN_ID,
    query: { refetchInterval: 15000, refetchOnWindowFocus: false },
  });

  const [txHash, setTxHash] = useState<string | null>(null);

  // Minted/Total (Dibiarkan sama)
  const [{ minted, total }, setProgress] = useState<{ minted: number; total: number }>({
    minted: 0,
    total: TOTAL_SUPPLY_FALLBACK,
  });

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const p = await fetchMintProgress();
        if (!stop) setProgress(p);
      } catch {}
    };
    load();
    const t = setInterval(load, 20000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  // Pfp & Carousel (Dibiarkan sama)
  const [pfpFailed, setPfpFailed] = useState(false);

  const allImgs = useMemo(() => expandImgUrls(), []);
  const [badSet, setBadSet] = useState<Set<string>>(new Set());
  const imgs = useMemo(() => allImgs.filter((u) => !badSet.has(u)), [allImgs, badSet]);

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
        background: "linear-gradient(180deg,#FDF5FB 0%,#FDF5FB 30%,#FDF5FB 100%)",
      }}
    >
      {/* Top Bar (Dibiarkan sama) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 700, color: "#FDF5FB" }}>{minted}/{total} minted</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!pfpFailed ? (
            <img
              src={FIXED_PFP_URL}
              width={32}
              height={32}
              referrerPolicy="no-referrer"
              style={{ borderRadius: "50%", border: "2px solid #fff", boxShadow: "0 0 0 2px #FDF5FB" }}
              onError={() => setPfpFailed(true)}
              alt="pfp"
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#FDF5FB",
                display: "grid",
                placeItems: "center",
                color: "#FDF5FB",
                fontWeight: 700,
              }}
            >
              {(address ?? "U").slice(2, 3).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Connect Error (Dibiarkan sama) */}
      {!isConnected && connectErr && (
        <div style={{ maxWidth: 520, margin: "0 auto 10px", fontSize: 13, lineHeight: 1.35, color: "#a33" }}>
          Farcaster 连接失败：{connectErr}
          <div style={{ opacity: 0.8 }}>
            若从未创建过 In-App Wallet，请在 Warpcast → Profile → Wallet 中先创建；或清一次 App 缓存后重试。
          </div>
        </div>
      )}

      {/* Title & Subtitle (Dibiarkan sama) */}
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
        aira chan ！
      </h1>

      <p style={{ textAlign: "center", color: "#375", opacity: 0.8, marginBottom: 16 }}>
        mint your aira chan · join aira chan fans club
      </p>

      {/* Main Image Card (Dibiarkan sama) */}
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
          <img
            key={imgs[idx]}
            src={imgs[idx]}
            alt="collection"
            style={{ width: "82%", height: "82%", objectFit: "cover", borderRadius: 12 }}
            onError={() =>
              setBadSet((prev) => {
                const ns = new Set(prev);
                ns.add(imgs[idx]);
                return ns;
              })
            }
          />
        ) : (
          <div style={{ opacity: 0.6, fontWeight: 600, color: "#557", padding: 12, textAlign: "center" }}>
            图片加载失败或未配置。请在 Vercel 设置
            <br />
            <b>NEXT_PUBLIC_IMG_LIST</b>（逗号分隔完整图片 URL）
            <br />或 <b>NEXT_PUBLIC_IMG_CID</b> + <b>NEXT_PUBLIC_IMG_COUNT</b>
          </div>
        )}
      </div>

      {/* Share / Mint */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 420, margin: "0 auto" }}>
        {/* Share Button (Dibiarkan sama, perlu disesuaikan teks/hashtag) */}
        <button
          onClick={() =>
            sdk.actions.composeCast({
              text: "我刚在 Sepolia 铸了一枚 NFT（0.001 ETH）#MintU", // Perbarui teks
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

        {/* ClaimButton */}
        {isConnected ? (
          client ? (
            <ClaimButton
              client={client}
              // MENGGANTI: thirdwebBase -> thirdwebSepolia
              chain={thirdwebSepolia}
              contractAddress={CONTRACT}
              claimParams={{ type: "ERC721" as const, quantity: 1n }}
              onTransactionConfirmed={(tx) => {
                setTxHash(tx.transactionHash);
                if (appUrl) {
                  sdk.actions.composeCast({
                    text: "我刚在 Sepolia 铸了一枚 NFT（0.001 ETH）#MintU", // Perbarui teks
                    embeds: [appUrl],
                  });
                }
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
            <button
              onClick={() =>
                alert("缺少 NEXT_PUBLIC_THIRDWEB_CLIENT_ID，去 Vercel → Settings → Environment Variables 添加后再部署")
              }
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
              配置后可 Mint
            </button>
          )
        ) : (
          <>
            {/* Farcaster Connect Button (Dibiarkan sama) */}
            {farcasterConnector && (
              <button
                onClick={async () => {
                  try {
                    await connect({ connector: farcasterConnector });
                    setConnectErr(null);
                  } catch (e: any) {
                    setConnectErr(e?.message || String(e));
                  }
                }}
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
                连接 Farcaster 钱包
              </button>
            )}

            {/* Other Connectors (Dibiarkan sama) */}
            {connectors
              .filter((c) => c !== farcasterConnector)
              .map((c) => (
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
              ))}
          </>
        )}
      </div>

      {/* Bottom: Balance + Success message */}
      <div style={{ maxWidth: 420, margin: "12px auto 0", textAlign: "center", color: "#334" }}>
        {isConnected ? (
          <p>
            {/* MENGGANTI: Base -> Sepolia */}
            Sepolia 余额： <b>{balance ? Number(balance.formatted).toFixed(4) : "--"} {balance?.symbol ?? "ETH"}</b>
          </p>
        ) : (
          <p style={{ opacity: 0.8 }}>
            如果连接失败：请在 Warpcast → Profile → Wallet 创建 In-App Wallet，并授权该 Mini App 使用。
          </p>
        )}
        {txHash && (
          <p style={{ marginTop: 8 }}>
            交易成功： <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">查看 Tx</a> {/* MENGGANTI: basescan -> sepolia.etherscan */}
          </p>
        )}
      </div>
    </main>
  );
}