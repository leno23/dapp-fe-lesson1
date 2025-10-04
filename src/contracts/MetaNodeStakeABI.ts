/**
 * MetaNodeStake 合约 ABI
 * 质押挖矿合约接口定义
 */
export const MetaNodeStakeABI = [
  // ==================== 查询函数 ====================
  {
    inputs: [],
    name: "poolLength",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_pid", type: "uint256" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "pendingMetaNode",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_pid", type: "uint256" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "stakingBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_pid", type: "uint256" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "withdrawAmount",
    outputs: [
      { internalType: "uint256", name: "requestAmount", type: "uint256" },
      { internalType: "uint256", name: "pendingWithdrawAmount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "pool",
    outputs: [
      { internalType: "address", name: "stTokenAddress", type: "address" },
      { internalType: "uint256", name: "poolWeight", type: "uint256" },
      { internalType: "uint256", name: "lastRewardBlock", type: "uint256" },
      { internalType: "uint256", name: "accMetaNodePerST", type: "uint256" },
      { internalType: "uint256", name: "stTokenAmount", type: "uint256" },
      { internalType: "uint256", name: "minDepositAmount", type: "uint256" },
      { internalType: "uint256", name: "unstakeLockedBlocks", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "startBlock",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "endBlock",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MetaNodePerBlock",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalPoolWeight",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ==================== 用户操作函数 ====================
  {
    inputs: [],
    name: "depositETH",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_pid", type: "uint256" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_pid", type: "uint256" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "unstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_pid", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_pid", type: "uint256" }],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ==================== 事件 ====================
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "uint256", name: "poolId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "uint256", name: "poolId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "RequestUnstake",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "uint256", name: "poolId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "blockNumber", type: "uint256" },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "uint256", name: "poolId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "MetaNodeReward", type: "uint256" },
    ],
    name: "Claim",
    type: "event",
  },
] as const;


