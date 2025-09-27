"use client";
import { useState, useEffect } from 'react';
import { useReadContract, useAccount, useChainId } from 'wagmi';
import { ERC20_ABI } from '../../../contracts/ERC20ABI';
import { getContractsByChainId, getNetworkInfo } from '../../../utils/constants';
import { formatUnits } from 'viem';

export default function WagmiTokenContract() {
  const chainId = useChainId();
  const { address } = useAccount();
  const [availableContracts, setAvailableContracts] = useState<Record<string, string>>({});
  const [contractAddress, setContractAddress] = useState('');
  const [networkInfo, setNetworkInfo] = useState<any>(null);

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

  // 读取代币信息
  const { data: name } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'name',
    query: { enabled: !!contractAddress }
  });

  const { data: symbol } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: { enabled: !!contractAddress }
  });

  const { data: decimals } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: !!contractAddress }
  });

  const { data: totalSupply } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
    query: { enabled: !!contractAddress }
  });

  const { data: balance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!contractAddress && !!address }
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        ERC20 代币合约查询 (Wagmi)
        {networkInfo && (
          <span className="text-sm font-normal text-blue-600 ml-2">
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

        {name && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">代币名称:</p>
                <p className="font-semibold">{name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">代币符号:</p>
                <p className="font-semibold">{symbol}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">精度:</p>
                <p className="font-semibold">{decimals?.toString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">总供应量:</p>
                <p className="font-semibold">
                  {totalSupply && decimals 
                    ? formatUnits(totalSupply, decimals) 
                    : 'Loading...'}
                </p>
              </div>
            </div>
            
            {address && balance !== undefined && (
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600">您的余额:</p>
                <p className="text-lg font-semibold text-green-600">
                  {decimals 
                    ? formatUnits(balance, decimals) 
                    : balance.toString()} {symbol}
                </p>
              </div>
            )}
            
            {!address && (
              <p className="text-sm text-red-600">请连接钱包查看余额</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
