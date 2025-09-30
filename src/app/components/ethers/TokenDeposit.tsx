"use client";
import { useWalletDetection, useTokenDeposit } from '@hooks';

export default function EthersTokenDeposit() {
  const { currentWallet, availableWallets } = useWalletDetection();
  const {
    selectedToken,
    amount,
    txHash,
    loading,
    contracts,
    tokenBalance,
    tokenSymbol,
    ethBalance,
    networkInfo,
    setSelectedToken,
    setAmount,
    depositToken
  } = useTokenDeposit();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">代币充值 (Ethers)</h3>
      
      {/* 钱包信息显示 */}
      {availableWallets.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                当前钱包: <span className="font-bold">{currentWallet}</span>
              </p>
              {availableWallets.length > 1 && (
                <p className="text-xs text-blue-600 mt-1">
                  检测到多个钱包: {availableWallets.join(', ')}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className={`inline-block w-2 h-2 rounded-full ${
                currentWallet !== 'None' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            </div>
          </div>
        </div>
      )}
      
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
          <div className="p-3 bg-gray-50 rounded-md space-y-1">
            <p className="text-sm text-gray-600">
              代币余额: {parseFloat(tokenBalance).toFixed(6)} {tokenSymbol}
            </p>
            <p className="text-sm text-blue-600 font-medium">
              ETH 余额: {parseFloat(ethBalance).toFixed(6)} ETH
            </p>
            {parseFloat(ethBalance) < 0.001 && (
              <p className="text-xs text-red-500">
                ⚠️ ETH 余额较低，可能无法支付 gas 费用
              </p>
            )}
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
          onClick={() => depositToken()}
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