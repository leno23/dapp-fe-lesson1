"use client";
import { useState, useEffect } from 'react';
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { getContractsByChainId } from '../../../utils/constants';

const tokenAbi = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

export default function WagmiTokenTransfer() {
  const chainId = useChainId();
  const { address } = useAccount();
  const [selectedToken, setSelectedToken] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [contracts, setContracts] = useState<Record<string, string>>({});

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    const contractList = getContractsByChainId(chainId);
    setContracts(contractList);
    if (Object.keys(contractList).length > 0) {
      setSelectedToken(Object.keys(contractList)[0]);
    }
  }, [chainId]);

  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: contracts[selectedToken] as `0x${string}`,
    abi: tokenAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!(selectedToken && address && contracts[selectedToken]) },
  });

  const { data: tokenSymbol } = useReadContract({
    address: contracts[selectedToken] as `0x${string}`,
    abi: tokenAbi,
    functionName: 'symbol',
    query: { enabled: !!(selectedToken && contracts[selectedToken]) },
  });

  useEffect(() => {
    if (isConfirmed) {
      refetchBalance();
    }
  }, [isConfirmed, refetchBalance]);

  const handleTransfer = () => {
    const amountInWei = parseUnits(amount, 18);
    
    writeContract({
      address: contracts[selectedToken] as `0x${string}`,
      abi: tokenAbi,
      functionName: 'transfer',
      args: [toAddress as `0x${string}`, amountInWei],
    });
  };

  const balanceFormatted = tokenBalance ? formatUnits(tokenBalance as bigint, 18) : '0';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">代币转账 (Wagmi)</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">选择代币</label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {Object.keys(contracts).map((token) => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
        </div>

        {selectedToken && tokenSymbol && tokenBalance !== undefined && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              余额: {parseFloat(balanceFormatted).toFixed(6)} {tokenSymbol as string}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">接收地址</label>
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">转账金额</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="输入转账金额"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              可用: {parseFloat(balanceFormatted).toFixed(6)} {tokenSymbol as string}
            </span>
            <button
              type="button"
              onClick={() => setAmount(balanceFormatted)}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              全部
            </button>
          </div>
        </div>

        <button
          onClick={handleTransfer}
          disabled={isPending}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300"
        >
          {isPending ? '转账中...' : '转账代币'}
        </button>
        
        {hash && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-600">交易哈希:</p>
            <p className="text-xs font-mono break-all text-blue-600">{hash}</p>
            {isConfirmed && <p className="text-sm text-green-600 mt-2">✅ 转账成功!</p>}
          </div>
        )}
      </div>
    </div>
  );
}