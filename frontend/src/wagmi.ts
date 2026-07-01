import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { genLayerBradbury, GENLAYER_RPC_URL } from "./chain";

const connectors = connectorsForWallets(
  [{ groupName: "Installed", wallets: [injectedWallet] }],
  { appName: "Lyceum", projectId: "lyceum" }
);

export const config = createConfig({
  connectors,
  chains: [genLayerBradbury],
  transports: { [genLayerBradbury.id]: http(GENLAYER_RPC_URL) },
  ssr: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
