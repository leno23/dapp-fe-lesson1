"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import { useChainId } from 'wagmi';
import { ERC20_ABI } from '../../../contracts/ERC20ABI';
import { getContractsByChainId, getNetworkInfo } from '../../../utils/constants';

interface TransferEvent {
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

export default function EthersEventListener() {
  const chainId = useChainId();
  const [availableContracts, setAvailableContracts] = useState<Record<string, string>>({});
  const [contractAddress, setContractAddress] = useState('');
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [events, setEvents] = useState<TransferEvent[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contractRef = useRef<ethers.Contract | null>(null);
  const providerRef = useRef<ethers.JsonRpcProvider | null>(null);

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

  const startListening = async () => {
    try {
      setError(null);
      setEvents([]);
      
      // 根据当前网络创建 provider 和合约实例
      const rpcUrl = networkInfo?.rpcUrl || 'https://rpc.sepolia.org';
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
      
      providerRef.current = provider;
      contractRef.current = contract;

      // 监听 Transfer 事件
      const transferHandler = async (from: string, to: string, value: bigint, event: any) => {
        console.log('Transfer event received:', { from, to, value, event });
        
        const newEvent: TransferEvent = {
          from,
          to,
          value: ethers.formatEther(value), // 这里简化处理，实际应该获取代币的 decimals
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash,
          timestamp: Date.now()
        };

        setEvents(prev => [newEvent, ...prev].slice(0, 10)); // 只保留最新10条
      };

      contract.on('Transfer', transferHandler);
      setIsListening(true);

    } catch (err: any) {
      console.error('Start listening error:', err);
      setError('开始监听失败: ' + err.message);
    }
  };

  const stopListening = () => {
    if (contractRef.current) {
      contractRef.current.removeAllListeners('Transfer');
      contractRef.current = null;
    }
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // 清理资源
  React.useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        Transfer 事件监听 (Ethers)
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
            disabled={isListening}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 color-dark-900"
          >
            {Object.entries(availableContracts).map(([tokenName, tokenAddress]) => (
              <option key={tokenName} value={tokenAddress}>
                {tokenName} ({networkInfo?.name || 'Unknown'})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={toggleListening}
          className={`w-full py-2 px-4 rounded-md font-medium ${
            isListening
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isListening ? '停止监听' : '开始监听'}
        </button>

        {isListening && (
          <div className="p-3 bg-green-50 rounded-md">
            <p className="text-sm text-green-600 flex items-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              正在监听 Transfer 事件...
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          <h4 className="font-medium text-gray-700">
            最新事件 ({events.length}/10)
          </h4>
          {events.length === 0 ? (
            <p className="text-sm text-gray-500">暂无事件</p>
          ) : (
            events.map((event, index) => (
              <div key={`${event.transactionHash}-${index}`} className="p-3 bg-gray-50 rounded-md text-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-xs text-gray-500">
                    Block: {event.blockNumber}
                  </span>
                </div>
                <div className="space-y-1">
                  <p><span className="font-medium">From:</span> {event.from.slice(0, 8)}...{event.from.slice(-6)}</p>
                  <p><span className="font-medium">To:</span> {event.to.slice(0, 8)}...{event.to.slice(-6)}</p>
                  <p><span className="font-medium">Amount:</span> {event.value}</p>
                  <p className="text-xs text-gray-500 break-all">
                    Tx: {event.transactionHash}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
