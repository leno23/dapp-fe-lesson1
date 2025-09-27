"use client";
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { http, WagmiProvider } from 'wagmi';
import {
  mainnet,
  sepolia,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
export default function WalletConnect({ children }: { children: React.ReactNode }   ) {
  const config = getDefaultConfig({
    appName: "DApp Frontend Lesson",
    projectId: "e01cebcfbc5e8353d1736bfc6293918b",
    chains: [mainnet, sepolia],
    ssr: false, // 关闭 SSR
    transports: {
        [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/mXqbqtme85tkvSUbAWZYV'),
        [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/mXqbqtme85tkvSUbAWZYV'),
    },
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}