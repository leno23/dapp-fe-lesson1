"use client";
import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ethers } from 'ethers';
import { getContractsByChainId } from '../../../utils/constants';
import { getNetworkInfo } from '@/utils/constants';

export default function EthersTokenDeposit() {
  const chainId = useChainId();
  const { address } = useAccount();
  const [selectedToken, setSelectedToken] = useState('');
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

  useEffect(() => {
    if (selectedToken && address && contracts[selectedToken]) {
      fetchTokenInfo();
    }
  }, [selectedToken, address, contracts]);
  const networkInfo = getNetworkInfo(chainId);

  const fetchTokenInfo = async () => {
    const provider = new ethers.JsonRpcProvider(networkInfo.rpcUrl);
    const contract = new ethers.Contract(
      contracts[selectedToken],
      [
        "function balanceOf(address) view returns (uint256)",
        "function symbol() view returns (string)",
        "function deposit() payable"
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

  const depositToken = async () => {
    setLoading(true);
    setTxHash(null);

    const provider = new ethers.JsonRpcProvider(networkInfo.rpcUrl);
    const wallet = new ethers.Wallet('0xee46391a7be1cb5e3e97ae095fcff049513b9269ba1da52e308e5d7e19298087', provider);
    const contract = new ethers.Contract(
      contracts[selectedToken],
      ["function deposit() payable"],
      wallet
    );

    const amountInWei = ethers.parseEther(amount);
    const tx = await contract.deposit({ value: amountInWei });
    setTxHash(tx.hash);
    
    await tx.wait();
    await fetchTokenInfo();
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">代币充值 (Ethers)</h3>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">充值金额</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="输入充值金额"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <button
          onClick={depositToken}
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-gray-300"
        >
          {loading ? '充值中...' : '充值代币'}
        </button>
        
        {txHash && (
          <div className="mt-4 p-4 bg-green-50 rounded-md">
            <p className="text-sm text-gray-600">交易哈希:</p>
            <p className="text-xs font-mono break-all text-green-600">{txHash}</p>
            <p className="text-sm text-green-600 mt-2">✅ 充值成功!</p>
          </div>
        )}
      </div>
    </div>
  );
}