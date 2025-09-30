import { useState, useEffect } from 'react';

// 扩展 Window 接口以包含钱包提供者
declare global {
  interface Window {
    ethereum?: any;
    okxwallet?: any;
  }
}

interface WalletInfo {
  name: string;
  provider: any;
}

export const useWalletDetection = () => {
  const [currentWallet, setCurrentWallet] = useState<string>('');
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);

  // 检测可用的钱包
  const detectWallets = (): string[] => {
    const wallets: string[] = [];
    
    if (typeof window !== 'undefined') {
      // 检测 MetaMask
      if (window.ethereum?.isMetaMask) {
        wallets.push('MetaMask');
      }
      
      // 检测 OKX Wallet
      if (window.okxwallet || window.ethereum?.isOkxWallet) {
        wallets.push('OKX Wallet');
      }
      
      // 检测其他钱包
      if (window.ethereum?.isCoinbaseWallet) {
        wallets.push('Coinbase Wallet');
      }
      
      if (window.ethereum?.isTrust) {
        wallets.push('Trust Wallet');
      }
    }
    
    return wallets;
  };

  // 获取当前活跃的钱包提供者信息
  const getCurrentWalletInfo = (): WalletInfo => {
    if (typeof window === 'undefined' || !window.ethereum) {
      return { name: 'None', provider: null };
    }

    // 检查是否是 OKX
    if (window.okxwallet) {
      return { name: 'OKX Wallet', provider: window.okxwallet };
    }
    
    // 检查 window.ethereum 的具体提供者
    if (window.ethereum.isOkxWallet) {
      return { name: 'OKX Wallet', provider: window.ethereum };
    }
    
    if (window.ethereum.isMetaMask && !window.ethereum.isOkxWallet) {
      return { name: 'MetaMask', provider: window.ethereum };
    }
    
    if (window.ethereum.isCoinbaseWallet) {
      return { name: 'Coinbase Wallet', provider: window.ethereum };
    }
    
    if (window.ethereum.isTrust) {
      return { name: 'Trust Wallet', provider: window.ethereum };
    }
    
    // 如果有多个提供者，window.ethereum 可能是代理
    if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
      const providers = window.ethereum.providers;
      const activeProvider = providers.find((p: any) => p.selectedAddress) || providers[0];
      
      if (activeProvider?.isOkxWallet) {
        return { name: 'OKX Wallet', provider: activeProvider };
      }
      if (activeProvider?.isMetaMask) {
        return { name: 'MetaMask', provider: activeProvider };
      }
    }
    
    return { name: 'Unknown Wallet', provider: window.ethereum };
  };

  // 获取正确的以太坊提供者
  const getEthereumProvider = () => {
    const walletInfo = getCurrentWalletInfo();
    
    if (walletInfo.name === 'OKX Wallet' && window.okxwallet) {
      return window.okxwallet;
    }
    
    return window.ethereum;
  };

  // 检测钱包
  useEffect(() => {
    const wallets = detectWallets();
    const walletInfo = getCurrentWalletInfo();
    
    setAvailableWallets(wallets);
    setCurrentWallet(walletInfo.name);
    
    console.log('钱包检测结果:', {
      availableWallets: wallets,
      currentWallet: walletInfo.name,
      hasOKX: !!window.okxwallet,
      hasMetaMask: !!window.ethereum?.isMetaMask,
      ethereumProviders: window.ethereum?.providers?.length || 0
    });
  }, []);

  return {
    currentWallet,
    availableWallets,
    getCurrentWalletInfo,
    getEthereumProvider
  };
};
