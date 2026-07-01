import { defineChain } from "viem";
export const GENLAYER_CHAIN_ID = 4221;
export const GENLAYER_RPC_URL = "https://rpc-bradbury.genlayer.com";
export const CONTRACT_ADDRESS = "0x60548026CdF9C9451c275Ad92eD7dF1a6e95AF8F" as const;
export const GENLAYER_NETWORK = "testnetBradbury" as const;
export const genLayerBradbury = defineChain({
  id: GENLAYER_CHAIN_ID,
  name: "GenLayer Bradbury",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: { default: { http: [GENLAYER_RPC_URL] }, public: { http: [GENLAYER_RPC_URL] } },
  blockExplorers: { default: { name: "Explorer", url: "https://explorer-bradbury.genlayer.com" } },
  testnet: true,
});
