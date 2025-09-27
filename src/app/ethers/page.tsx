"use client";
import Navigation from '../components/Navigation';
import EthersBalanceChecker from '../components/ethers/BalanceChecker';
import EthersTransactionSender from '../components/ethers/TransactionSender';
import EthersTokenContract from '../components/ethers/TokenContract';
import EthersEventListener from '../components/ethers/EventListener';

export default function EthersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ethers.js 实现</h1>
          <p className="mt-2 text-gray-600">
            使用 Ethers.js 库实现以太坊交互功能
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EthersBalanceChecker />
          <EthersTransactionSender />
          <EthersTokenContract />
          <EthersEventListener />
        </div>
      </div>
    </div>
  );
}
