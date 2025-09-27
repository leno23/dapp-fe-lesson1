"use client";
import React, { useState, useRef, useEffect } from 'react';
import { usePublicClient, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { ERC20_ABI } from '../../../contracts/ERC20ABI';
import { getContractsByChainId, getNetworkInfo } from '../../../utils/constants';

interface TransferEvent {
  from: string;
  to: string;
  value: bigint;
  blockNumber: bigint;
  transactionHash: string;
  timestamp: number;
}

export default function ViemEventListener() {
  const chainId = useChainId();
  const [availableContracts, setAvailableContracts] = useState<Record<string, string>>({});
  const [contractAddress, setContractAddress] = useState('');
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [events, setEvents] = useState<TransferEvent[]>([]);
  const [isListening, setIsListening] = useState(false);

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
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const publicClient = usePublicClient();

  const startListening = async () => {
    if (!publicClient) {
      setError('Public client 未初始化');
      return;
    }

    try {
      setError(null);
      setEvents([]);
      
      // 使用 viem 监听合约事件
      const unsubscribe = publicClient.watchContractEvent({
        address: contractAddress as `0x${string}`,
        abi: ERC20_ABI,
        eventName: 'Transfer',
        onLogs: (logs) => {
          console.log('Transfer events received:', logs);
          
          const newEvents = logs.map(log => ({
            from: log.args.from as string,
            to: log.args.to as string,
            value: log.args.value as bigint,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            timestamp: Date.now()
          }));
          
          setEvents(prev => [...newEvents, ...prev].slice(0, 10)); // 只保留最新10条
        },
        onError: (error) => {
          console.error('Event listening error:', error);
          setError('事件监听出错: ' + error.message);
        }
      });

      unsubscribeRef.current = unsubscribe;
      setIsListening(true);

    } catch (err: any) {
      console.error('Start listening error:', err);
      setError('开始监听失败: ' + err.message);
    }
  };

  const stopListening = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
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
        Transfer 事件监听 (Viem)
        {networkInfo && (
          <span className="text-sm font-normal text-purple-600 ml-2">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
          disabled={!publicClient}
          className={`w-full py-2 px-4 rounded-md font-medium ${
            isListening
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          } disabled:bg-gray-300 disabled:cursor-not-allowed`}
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
                    Block: {event.blockNumber.toString()}
                  </span>
                </div>
                <div className="space-y-1">
                  <p><span className="font-medium">From:</span> {event.from.slice(0, 8)}...{event.from.slice(-6)}</p>
                  <p><span className="font-medium">To:</span> {event.to.slice(0, 8)}...{event.to.slice(-6)}</p>
                  <p><span className="font-medium">Amount:</span> {formatUnits(event.value, 18)}</p>
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
