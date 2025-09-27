"use client";
import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { formatEther } from 'viem';

export default function ViemBalanceChecker() {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  const checkBalance = async () => {
    if (!address || address.length !== 42 || !publicClient) {
      setError('请输入有效的地址');
      return;
    }

    setLoading(true);
    setError(null);
    setBalance(null);

    try {
      const balanceWei = await publicClient.getBalance({
        address: address as `0x${string}`,
      });
      setBalance(balanceWei);
    } catch (err) {
      console.error('Balance check error:', err);
      setError('查询余额失败，请检查地址或网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">余额查询 (Viem)</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            钱包地址
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={checkBalance}
          disabled={!address || address.length !== 42 || loading || !publicClient}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? '查询中...' : '查询余额'}
        </button>
        
        {balance !== null && (
          <div className="mt-4 p-4 bg-green-50 rounded-md">
            <p className="text-sm text-gray-600">余额:</p>
            <p className="text-lg font-semibold text-green-600">
              {formatEther(balance)} ETH
            </p>
            <p className="text-xs text-gray-500">
              原始值: {balance.toString()} wei
            </p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
