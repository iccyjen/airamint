// src/app/thirdweb.ts
import { createThirdwebClient } from "thirdweb";

export const client = createThirdwebClient({
  // 你已经在 Vercel 配了 NEXT_PUBLIC_THIRDWEB_CLIENT_ID
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});
