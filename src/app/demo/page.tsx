"use client";
import { HashRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import EthersBalanceChecker from "../components/ethers/BalanceChecker";
import EthersTransactionSender from "../components/ethers/TransactionSender";
import EthersTokenContract from "../components/ethers/TokenContract";
import EthersEventListener from "../components/ethers/EventListener";
import EthersTokenDeposit from "../components/ethers/TokenDeposit";
import EthersTokenTransfer from "../components/ethers/TokenTransfer";
import WagmiBalanceChecker from "../components/wagmi/BalanceChecker";
import WagmiTransactionSender from "../components/wagmi/TransactionSender";
import WagmiTokenContract from "../components/wagmi/TokenContract";
import WagmiEventListener from "../components/wagmi/EventListener";
import WagmiTokenDeposit from "../components/wagmi/TokenDeposit";
import WagmiTokenTransfer from "../components/wagmi/TokenTransfer";
import ViemBalanceChecker from "../components/viem/BalanceChecker";
import ViemTransactionSender from "../components/viem/TransactionSender";
import ViemTokenContract from "../components/viem/TokenContract";
import ViemEventListener from "../components/viem/EventListener";
import ViemTokenDeposit from "../components/viem/TokenDeposit";
import ViemTokenTransfer from "../components/viem/TokenTransfer";

// Ethers 子页面组件
function EthersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ethers.js 实现</h1>
        <p className="mt-2 text-gray-600">使用 Ethers.js 库实现以太坊交互功能</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <EthersBalanceChecker />
        <EthersTransactionSender />
        <EthersTokenContract />
        <EthersTokenDeposit />
        <EthersTokenTransfer />
        <EthersEventListener />
      </div>
    </div>
  );
}

// Wagmi 子页面组件
function WagmiPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Wagmi 实现</h1>
        <p className="mt-2 text-gray-600">使用 Wagmi React Hooks 实现以太坊交互功能</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <WagmiBalanceChecker />
        <WagmiTransactionSender />
        <WagmiTokenContract />
        <WagmiTokenDeposit />
        <WagmiTokenTransfer />
        <WagmiEventListener />
      </div>
    </div>
  );
}

// Viem 子页面组件
function ViemPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Viem 实现</h1>
        <p className="mt-2 text-gray-600">使用 Viem 原生 API 实现以太坊交互功能</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <ViemBalanceChecker />
        <ViemTransactionSender />
        <ViemTokenContract />
        <ViemTokenDeposit />
        <ViemTokenTransfer />
        <ViemEventListener />
      </div>
    </div>
  );
}

// 导航菜单组件
function HashRouterNav() {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 py-4">
          <Link
            to="/ethers"
            className={({ isActive }: { isActive: boolean }) =>
              `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            Ethers.js
          </Link>
          <Link
            to="/wagmi"
            className={({ isActive }: { isActive: boolean }) =>
              `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            Wagmi
          </Link>
          <Link
            to="/viem"
            className={({ isActive }: { isActive: boolean }) =>
              `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            Viem
          </Link>
        </div>
      </div>
    </div>
  );
}

// 主页面组件
export default function DemoPage() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <HashRouterNav />
        <Routes>
          <Route path="/" element={<Navigate to="/ethers" replace />} />
          <Route path="/ethers" element={<EthersPage />} />
          <Route path="/wagmi" element={<WagmiPage />} />
          <Route path="/viem" element={<ViemPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

