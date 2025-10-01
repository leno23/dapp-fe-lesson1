"use client";
import { useState, useEffect } from 'react';
import { useBalance, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { getNetworkInfo } from '../../../utils/constants';

export default function WagmiBalanceChecker() {
  const chainId = useChainId();
  const [address, setAddress] = useState('');
  const [networkInfo, setNetworkInfo] = useState<{ 
    chainId: number; 
    name: string; 
    rpcUrl: string 
  } | null>(null);
  
  // 根据当前网络更新网络信息
  useEffect(() => {
    const network = getNetworkInfo(chainId);
    setNetworkInfo(network);
  }, [chainId]);

  const { data: balance, isError, isLoading, refetch } = useBalance({
    address: address as `0x${string}`,
    query: {
      enabled: !!address && address.length === 42,
    }
  });

  const handleCheck = () => {
    if (address && address.length === 42) {
      refetch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        余额查询 (Wagmi)
        {networkInfo && (
          <span className="text-sm font-normal text-blue-600 ml-2">
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
          onClick={handleCheck}
          disabled={!address || address.length !== 42 || isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '查询中...' : '查询余额'}
        </button>
        
        {balance && (
          <div className="mt-4 p-4 bg-green-50 rounded-md">
            <p className="text-sm text-gray-600">余额:</p>
            <p className="text-lg font-semibold text-green-600">
              {formatEther(balance.value)} {balance.symbol}
            </p>
            <p className="text-xs text-gray-500">
              链: {balance.formatted} {balance.symbol}
            </p>
          </div>
        )}
        
        {isError && (
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <p className="text-sm text-red-600">查询失败，请检查地址格式</p>
          </div>
        )}
      </div>
    </div>
  );
}
