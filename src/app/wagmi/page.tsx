"use client";
import Navigation from '../components/Navigation';
import WagmiBalanceChecker from '../components/wagmi/BalanceChecker';
import WagmiTransactionSender from '../components/wagmi/TransactionSender';
import WagmiTokenContract from '../components/wagmi/TokenContract';
import WagmiEventListener from '../components/wagmi/EventListener';

export default function WagmiPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wagmi 实现</h1>
          <p className="mt-2 text-gray-600">
            使用 Wagmi React Hooks 实现以太坊交互功能
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WagmiBalanceChecker />
          <WagmiTransactionSender />
          <WagmiTokenContract />
          <WagmiEventListener />
        </div>
      </div>
    </div>
  );
}
