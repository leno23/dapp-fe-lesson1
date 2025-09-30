"use client";
import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ethers } from 'ethers';
import { getContractsByChainId } from '../../../utils/constants';
import { getNetworkInfo } from '@/utils/constants';

export default function EthersTokenTransfer() {
  const chainId = useChainId();
  const { address } = useAccount();
  const [selectedToken, setSelectedToken] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<Record<string, string>>({});
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [tokenSymbol, setTokenSymbol] = useState<string>('');

  useEffect(() => {
    const contractList = getContractsByChainId(chainId);
    setContracts(contractList);
    if (Object.keys(contractList).length > 0) {
      setSelectedToken(Object.keys(contractList)[0]);
    }
  }, [chainId]);

  const networkInfo = getNetworkInfo(chainId);

  useEffect(() => {
    if (selectedToken && address && contracts[selectedToken]) {
      fetchTokenInfo();
    }
  }, [selectedToken, address, contracts]);

  const fetchTokenInfo = async () => {
    const provider = new ethers.JsonRpcProvider(networkInfo.rpcUrl);
    const contract = new ethers.Contract(
      contracts[selectedToken],
      [
        "function balanceOf(address) view returns (uint256)",
        "function symbol() view returns (string)"
      ],
      provider
    );

    const [balance, symbol] = await Promise.allSettled([
      contract.balanceOf(address),
      contract.symbol()
    ]);

    setTokenBalance(ethers.formatUnits(balance.status === 'fulfilled' ? balance.value : 0, 18));
    setTokenSymbol(symbol.status === 'fulfilled' ? symbol.value : '');
  };

  const transferToken = async () => {
    if (!window.ethereum) {
      alert('请安装 MetaMask 或其他以太坊钱包');
      return;
    }

    try {
      setLoading(true);
      setTxHash(null);

      // 使用浏览器钱包提供者
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(
        contracts[selectedToken],
        ["function transfer(address to, uint256 amount) returns (bool)"],
        signer
      );

      const amountInWei = ethers.parseUnits(amount, 18);
      const tx = await contract.transfer(toAddress, amountInWei);
      setTxHash(tx.hash);
      
      await tx.wait();
      await fetchTokenInfo();
    } catch (error: any) {
      console.error('转账失败:', error);
      alert('转账失败: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">代币转账 (Ethers)</h3>
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

        {selectedToken && tokenSymbol && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              余额: {parseFloat(tokenBalance).toFixed(6)} {tokenSymbol}
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
              可用: {parseFloat(tokenBalance).toFixed(6)} {tokenSymbol}
            </span>
            <button
              type="button"
              onClick={() => setAmount(tokenBalance)}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              全部
            </button>
          </div>
        </div>

        <button
          onClick={transferToken}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300"
        >
          {loading ? '转账中...' : '转账代币'}
        </button>
        
        {txHash && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-600">交易哈希:</p>
            <p className="text-xs font-mono break-all text-blue-600">{txHash}</p>
            <p className="text-sm text-green-600 mt-2">✅ 转账成功!</p>
          </div>
        )}
      </div>
    </div>
  );
}