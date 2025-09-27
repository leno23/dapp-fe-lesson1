"use client";
import { useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { parseEther } from 'viem';

export default function ViemTransactionSender() {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const sendTransaction = async () => {
    if (!address || !walletClient) {
      setError('请先连接钱包');
      return;
    }

    if (!to || !amount) {
      setError('请填写完整信息');
      return;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);
    setIsConfirmed(false);

    try {
      // 使用 viem 发送交易
      const hash = await walletClient.sendTransaction({
        to: to as `0x${string}`,
        value: parseEther(amount),
      });

      setTxHash(hash);
      
      // 等待交易确认
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
        });
        console.log('Transaction confirmed:', receipt);
        setIsConfirmed(true);
      }
      
    } catch (err: any) {
      console.error('Transaction error:', err);
      setError(err.message || '交易失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">发送交易 (Viem)</h3>
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
          onClick={sendTransaction}
          disabled={!address || !to || !amount || loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? '发送中...' : '发送交易'}
        </button>
        
        {!address && (
          <p className="text-sm text-red-600">请先连接钱包</p>
        )}
        
        {txHash && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-600">交易哈希:</p>
            <p className="text-xs font-mono break-all text-blue-600">{txHash}</p>
            {!isConfirmed && loading && (
              <p className="text-sm text-blue-600">等待确认中...</p>
            )}
            {isConfirmed && (
              <p className="text-sm text-green-600">交易已确认!</p>
            )}
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
