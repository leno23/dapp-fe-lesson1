// ERC20 代币合约地址 (Sepolia 测试网)
export const SEPOLIA_ERC20_CONTRACTS = {
  // USDC on Sepolia (官方测试代币)
  USDC: "0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0",
  // Link Token on Sepolia
  WETH: "0x7b79995e5f793a07bc00c21412e50ecae098e7f9",
};

export const MAINNET_ERC20_CONTRACTS = {
  USDC: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  WETH: "0x7b79995e5f793a07bc00c21412e50ecae098e7f9",
};

// 根据网络ID获取对应的合约配置
export function getContractsByChainId(chainId: number): Record<string, string> {
  switch (chainId) {
    case 11155111: // Sepolia
      return SEPOLIA_ERC20_CONTRACTS;
    case 1: // Mainnet
      return MAINNET_ERC20_CONTRACTS;
    default:
      // 默认返回 Sepolia 合约
      return SEPOLIA_ERC20_CONTRACTS;
  }
}

// 根据网络名称获取对应的合约配置
export function getContractsByNetwork(networkName: string): Record<string, string> {
  switch (networkName.toLowerCase()) {
    case 'sepolia':
      return SEPOLIA_ERC20_CONTRACTS;
    case 'mainnet':
    case 'ethereum':
      return MAINNET_ERC20_CONTRACTS;
    default:
      return SEPOLIA_ERC20_CONTRACTS;
  }
}

// 获取网络信息根据链ID
export function getNetworkInfo(chainId: number) {
  switch (chainId) {
    case 11155111:
      return NETWORKS.SEPOLIA;
    case 1:
      return NETWORKS.MAINNET;
    default:
      return NETWORKS.SEPOLIA;
  }
}

// 网络配置
export const NETWORKS = {
  SEPOLIA: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/mXqbqtme85tkvSUbAWZYV"
  },
  MAINNET: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/mXqbqtme85tkvSUbAWZYV"
  }
};
