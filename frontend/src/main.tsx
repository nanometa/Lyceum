import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { config } from "./wagmi";
import { Shell } from "./Shell";
import "./index.css";

const queryClient = new QueryClient();
const theme = darkTheme({ accentColor: "#7d92ff", accentColorForeground: "#0a1030", borderRadius: "small", fontStack: "system", overlayBlur: "small" });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme} locale="en-US"><Shell /></RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
