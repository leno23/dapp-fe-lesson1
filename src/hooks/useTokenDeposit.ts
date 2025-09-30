import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ethers } from 'ethers';
import { getContractsByChainId, getNetworkInfo } from '@/utils/constants';
import { useWalletDetection } from '@hooks/useWalletDetection';

export const useTokenDeposit = () => {
  const chainId = useChainId();
  const { address } = useAccount();
  const { getCurrentWalletInfo, getEthereumProvider } = useWalletDetection();

  const [selectedToken, setSelectedToken] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<Record<string, string>>({});
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [tokenSymbol, setTokenSymbol] = useState<string>('');
  const [ethBalance, setEthBalance] = useState<string>('0');

  const networkInfo = getNetworkInfo(chainId);

  // 初始化合约列表
  useEffect(() => {
    const contractList = getContractsByChainId(chainId);
    setContracts(contractList);
    if (Object.keys(contractList).length > 0) {
      setSelectedToken(Object.keys(contractList)[0]);
    }
  }, [chainId]);

  // 获取代币信息
  const fetchTokenInfo = async () => {
    if (!selectedToken || !address || !contracts[selectedToken]) return;

    try {
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

      const [balance, symbol, ethBal] = await Promise.allSettled([
        contract.balanceOf(address),
        contract.symbol(),
        provider.getBalance(address!)
      ]);

      setTokenBalance(ethers.formatUnits(balance.status === 'fulfilled' ? balance.value : 0, 18));
      setTokenSymbol(symbol.status === 'fulfilled' ? symbol.value : '');
      setEthBalance(ethers.formatEther(ethBal.status === 'fulfilled' ? ethBal.value : 0));
    } catch (error) {
      console.error('获取代币信息失败:', error);
    }
  };

  // 监听变化并更新代币信息
  useEffect(() => {
    fetchTokenInfo();
  }, [selectedToken, address, contracts]);

  // 执行充值
  const depositToken = async (): Promise<boolean> => {
    if (!window.ethereum) {
      alert('请安装 MetaMask、OKX 或其他以太坊钱包');
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('请输入有效的充值金额');
      return false;
    }

    try {
      setLoading(true);
      setTxHash(null);

      // 获取当前钱包信息
      const walletInfo = getCurrentWalletInfo();
      console.log('使用钱包:', walletInfo.name);

      // 使用正确的钱包提供者
      const ethereumProvider = getEthereumProvider();
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      
      // 检查网络是否匹配
      const network = await provider.getNetwork();
      console.log('网络信息:', {
        chainId: Number(network.chainId),
        expectedChainId: chainId,
        networkName: network.name
      });

      if (Number(network.chainId) !== chainId) {
        alert(`网络不匹配！\n当前网络: ${network.name} (${Number(network.chainId)})\n期望网络: ${chainId}\n\n请在钱包中切换到正确的网络。`);
        return false;
      }

      // 检查地址是否匹配
      if (signerAddress.toLowerCase() !== address?.toLowerCase()) {
        alert(`地址不匹配！\n钱包地址: ${signerAddress}\nWagmi地址: ${address}\n\n请确保钱包连接正确。`);
        return false;
      }
      
      const amountInWei = ethers.parseEther(amount);
      
      // 使用钱包提供者获取实时余额
      const walletBalance = await provider.getBalance(signerAddress);
      
      // 估算 gas 费用
      const contract = new ethers.Contract(
        contracts[selectedToken],
        ["function deposit() payable"],
        signer
      );

      let gasEstimate: bigint;
      let feeData: any;
      try {
        // 尝试估算 gas
        gasEstimate = await contract.deposit.estimateGas({ value: amountInWei });
        feeData = await provider.getFeeData();
      } catch (gasError: any) {
        console.error('Gas估算失败:', gasError);
        alert(`Gas估算失败: ${gasError.message}\n\n可能原因:\n1. 合约地址错误\n2. 网络问题\n3. 合约不支持此操作`);
        return false;
      }

      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      const estimatedGasCost = gasEstimate * gasPrice;
      const totalCost = amountInWei + estimatedGasCost;

      console.log('详细余额检查:', {
        signerAddress,
        wagmiAddress: address,
        walletBalance: ethers.formatEther(walletBalance),
        displayedEthBalance: ethBalance,
        depositAmount: ethers.formatEther(amountInWei),
        gasEstimate: gasEstimate.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei',
        estimatedGasCost: ethers.formatEther(estimatedGasCost),
        totalCost: ethers.formatEther(totalCost),
        sufficient: walletBalance >= totalCost
      });

      if (walletBalance < totalCost) {
        const shortfall = totalCost - walletBalance;
        alert(`余额不足！\n\n钱包实时余额: ${ethers.formatEther(walletBalance)} ETH\n显示的余额: ${ethBalance} ETH\n充值金额: ${ethers.formatEther(amountInWei)} ETH\nGas费用: ${ethers.formatEther(estimatedGasCost)} ETH\n总需要: ${ethers.formatEther(totalCost)} ETH\n缺少: ${ethers.formatEther(shortfall)} ETH\n\n请刷新页面或等待余额同步。`);
        return false;
      }

      console.log('开始执行交易...');
      const tx = await contract.deposit({ value: amountInWei });
      setTxHash(tx.hash);
      
      await tx.wait();
      await fetchTokenInfo();
      return true;

    } catch (error: any) {
      console.error('充值失败 - 完整错误信息:', {
        error,
        code: error.code,
        message: error.message,
        reason: error.reason,
        data: error.data
      });
      
      let errorMessage = '充值失败: ';
      
      if (error.code === 'INSUFFICIENT_FUNDS' || error.code === -32000) {
        // 获取最新余额进行二次检查
        try {
          const provider = new ethers.BrowserProvider(getEthereumProvider());
          const signer = await provider.getSigner();
          const currentBalance = await provider.getBalance(await signer.getAddress());
          
          errorMessage += `余额不足详情:\n`;
          errorMessage += `当前实际余额: ${ethers.formatEther(currentBalance)} ETH\n`;
          errorMessage += `充值金额: ${amount} ETH\n`;
          errorMessage += `\n可能原因:\n`;
          errorMessage += `1. Gas费用过高，总成本超过余额\n`;
          errorMessage += `2. 网络拥堵导致gas费用激增\n`;
          errorMessage += `3. 余额显示延迟，实际余额不足\n`;
          errorMessage += `4. 同时进行多笔交易导致余额不足\n\n`;
          errorMessage += `建议: 尝试减少充值金额或等待网络不那么拥堵时再试`;
        } catch {
          errorMessage += '账户余额不足，请检查您的 ETH 余额是否足够支付充值金额和 gas 费用';
        }
      } else if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        errorMessage += '用户取消了交易';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage += '余额不足，请确保有足够的 ETH 支付交易和 gas 费用';
      } else if (error.message?.includes('gas')) {
        errorMessage += `Gas相关错误: ${error.message}\n\n可能原因:\n1. Gas估算失败\n2. Gas价格设置过低\n3. 网络拥堵`;
      } else if (error.message?.includes('reverted')) {
        errorMessage += `合约执行失败: ${error.reason || error.message}\n\n可能原因:\n1. 合约逻辑错误\n2. 参数不正确\n3. 合约状态不允许此操作`;
      } else {
        errorMessage += `${error.message || error}\n\n错误代码: ${error.code || '未知'}`;
      }
      
      alert(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    // 状态
    selectedToken,
    amount,
    txHash,
    loading,
    contracts,
    tokenBalance,
    tokenSymbol,
    ethBalance,
    networkInfo,
    
    // 操作
    setSelectedToken,
    setAmount,
    depositToken,
    fetchTokenInfo
  };
};
