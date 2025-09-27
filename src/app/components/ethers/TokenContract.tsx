"use client";
import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ethers } from 'ethers';
import { ERC20_ABI } from '../../../contracts/ERC20ABI';
import { getContractsByChainId, getNetworkInfo } from '../../../utils/constants';

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  userBalance: string;
}

export default function EthersTokenContract() {
  const chainId = useChainId();
  const { address } = useAccount();
  const [availableContracts, setAvailableContracts] = useState<Record<string, string>>({});
  const [contractAddress, setContractAddress] = useState('');
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 根据当前网络更新可用合约
  useEffect(() => {
    const contracts = getContractsByChainId(chainId);
    const network = getNetworkInfo(chainId);
    setAvailableContracts(contracts);
    setNetworkInfo(network);
    // 设置默认选中第一个合约
    const firstContract = Object.values(contracts)[0];
    if (firstContract && contractAddress !== firstContract) {
      setContractAddress(firstContract);
    }
  }, [chainId]);

  const fetchTokenInfo = async () => {
    if (!contractAddress) return;

    setLoading(true);
    setError(null);
    setTokenInfo(null);

    try {
      // 根据当前网络创建 provider
      const rpcUrl = networkInfo?.rpcUrl || 'https://rpc.sepolia.org';
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // 创建合约实例
      const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

      // 并行获取基本信息
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ]);

      // 获取用户余额（如果已连接钱包）
      let userBalance = '0';
      if (address) {
        const balance = await contract.balanceOf(address);
        userBalance = ethers.formatUnits(balance, decimals);
      }

      setTokenInfo({
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        userBalance
      });

    } catch (err: any) {
      console.error('Token info fetch error:', err);
      setError('获取代币信息失败，请检查合约地址');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenInfo();
  }, [contractAddress, address]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        ERC20 代币合约查询 (Ethers)
        {networkInfo && (
          <span className="text-sm font-normal text-green-600 ml-2">
            - {networkInfo.name}
          </span>
        )}
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            合约地址 {networkInfo && <span className="text-xs text-gray-500">({networkInfo.name} 网络)</span>}
          </label>
          <select
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(availableContracts).map(([tokenName, tokenAddress]) => (
              <option key={tokenName} value={tokenAddress}>
                {tokenName} ({networkInfo?.name || 'Unknown'})
              </option>
            ))}
          </select>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="或输入自定义合约地址"
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={fetchTokenInfo}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? '查询中...' : '查询代币信息'}
        </button>

        {tokenInfo && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">代币名称:</p>
                <p className="font-semibold">{tokenInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">代币符号:</p>
                <p className="font-semibold">{tokenInfo.symbol}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">精度:</p>
                <p className="font-semibold">{tokenInfo.decimals}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">总供应量:</p>
                <p className="font-semibold">{tokenInfo.totalSupply}</p>
              </div>
            </div>
            
            {address && (
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600">您的余额:</p>
                <p className="text-lg font-semibold text-green-600">
                  {tokenInfo.userBalance} {tokenInfo.symbol}
                </p>
              </div>
            )}
            
            {!address && (
              <p className="text-sm text-red-600">请连接钱包查看余额</p>
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
