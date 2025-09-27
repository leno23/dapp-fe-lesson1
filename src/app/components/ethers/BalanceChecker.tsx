"use client";
import { useState, useEffect } from 'react';
import { useWalletClient, useChainId } from 'wagmi';
import { ethers } from 'ethers';
import { getNetworkInfo } from '../../../utils/constants';

export default function EthersBalanceChecker() {
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  // 根据当前网络更新网络信息
  useEffect(() => {
    const network = getNetworkInfo(chainId);
    setNetworkInfo(network);
  }, [chainId]);

  const checkBalance = async () => {
    if (!address || address.length !== 42) {
      setError('请输入有效的地址');
      return;
    }

    setLoading(true);
    setError(null);
    setBalance(null);

    try {
      // 根据当前网络创建 ethers provider
      const rpcUrl = networkInfo?.rpcUrl || 'https://rpc.sepolia.org';
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      const balanceWei = await provider.getBalance(address);
      const balanceEth = ethers.formatEther(balanceWei);
      setBalance(balanceEth);
    } catch (err) {
      console.error('Balance check error:', err);
      setError('查询余额失败，请检查地址或网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        余额查询 (Ethers)
        {networkInfo && (
          <span className="text-sm font-normal text-green-600 ml-2">
            - {networkInfo.name}
          </span>
        )}
      </h3>
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
          disabled={!address || address.length !== 42 || loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? '查询中...' : '查询余额'}
        </button>
        
        {balance && (
          <div className="mt-4 p-4 bg-green-50 rounded-md">
            <p className="text-sm text-gray-600">余额:</p>
            <p className="text-lg font-semibold text-green-600">
              {balance} ETH
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
