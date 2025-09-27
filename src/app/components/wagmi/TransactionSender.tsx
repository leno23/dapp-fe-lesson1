"use client";
import { useState, useEffect } from 'react';
import { useSendTransaction, useAccount, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { getNetworkInfo } from '../../../utils/constants';

export default function WagmiTransactionSender() {
  const chainId = useChainId();
  const { address } = useAccount();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const { data: hash, sendTransaction, isPending, error } = useSendTransaction();
  
  // 根据当前网络更新网络信息
  useEffect(() => {
    const network = getNetworkInfo(chainId);
    setNetworkInfo(network);
  }, [chainId]);
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({
      hash,
    });

  const handleSend = () => {
    if (!to || !amount || !address) return;
    
    try {
      sendTransaction({
        to: to as `0x${string}`,
        value: parseEther(amount),
      });
    } catch (err) {
      console.error('Transaction error:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        发送交易 (Wagmi)
        {networkInfo && (
          <span className="text-sm font-normal text-blue-600 ml-2">
            - {networkInfo.name}
          </span>
        )}
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            接收地址
          </label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            金额 (ETH)
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!address || !to || !amount || isPending}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isPending ? '发送中...' : '发送交易'}
        </button>
        
        {!address && (
          <p className="text-sm text-red-600">请先连接钱包</p>
        )}
        
        {hash && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-600">交易哈希:</p>
            <p className="text-xs font-mono break-all text-blue-600">{hash}</p>
            {isConfirming && <p className="text-sm text-blue-600">等待确认中...</p>}
            {isConfirmed && <p className="text-sm text-green-600">交易已确认!</p>}
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <p className="text-sm text-red-600">
              交易失败: {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
