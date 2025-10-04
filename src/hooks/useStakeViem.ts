import { useState, useEffect, useCallback } from "react";
import { createPublicClient, createWalletClient, custom, http, parseAbi } from "viem";
import { mainnet } from "viem/chains";
import { MetaNodeStakeABI } from "@/contracts/MetaNodeStakeABI";
import { ERC20_ABI } from "@/contracts/ERC20ABI";
import { getStakeContractAddress } from "@/utils/constants";

export function useStakeViem(poolId: number, tokenAddress?: string, isETHPool = false) {
  const [address, setAddress] = useState<string>("");
  const [chainId, setChainId] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // 数据状态
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [stakingBalance, setStakingBalance] = useState<bigint>(BigInt(0));
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [pendingRewards, setPendingRewards] = useState<bigint>(BigInt(0));
  const [poolData, setPoolData] = useState<any>(null);
  const [withdrawData, setWithdrawData] = useState<[bigint, bigint]>([BigInt(0), BigInt(0)]);
  const [currentBlock, setCurrentBlock] = useState<bigint>(BigInt(0));

  const [publicClient, setPublicClient] = useState<any>(null);
  const [walletClient, setWalletClient] = useState<any>(null);

  // 初始化
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const pubClient = createPublicClient({
        chain: mainnet,
        transport: custom(window.ethereum),
      });
      setPublicClient(pubClient);

      const wallClient = createWalletClient({
        chain: mainnet,
        transport: custom(window.ethereum),
      });
      setWalletClient(wallClient);

      wallClient.getAddresses().then(addrs => {
        if (addrs[0]) setAddress(addrs[0]);
      });

      wallClient.getChainId().then(setChainId);
    }
  }, []);

  const contractAddress = chainId ? getStakeContractAddress(chainId) as `0x${string}` : "" as `0x${string}`;

  // 刷新数据
  const refetch = useCallback(async () => {
    if (!publicClient || !address || !contractAddress) return;

    try {
      // 获取余额
      if (isETHPool) {
        const bal = await publicClient.getBalance({ address: address as `0x${string}` });
        setUserBalance(bal);
      } else if (tokenAddress) {
        const bal = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        });
        setUserBalance(bal as bigint);

        const allow = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address as `0x${string}`, contractAddress],
        });
        setAllowance(allow as bigint);
      }

      // 获取质押余额
      const stBal = await publicClient.readContract({
        address: contractAddress,
        abi: MetaNodeStakeABI,
        functionName: "stakingBalance",
        args: [BigInt(poolId), address as `0x${string}`],
      });
      setStakingBalance(stBal as bigint);

      // 获取待领取奖励
      const pending = await publicClient.readContract({
        address: contractAddress,
        abi: MetaNodeStakeABI,
        functionName: "pendingMetaNode",
        args: [BigInt(poolId), address as `0x${string}`],
      });
      setPendingRewards(pending as bigint);

      // 获取池子信息
      const pool = await publicClient.readContract({
        address: contractAddress,
        abi: MetaNodeStakeABI,
        functionName: "pool",
        args: [BigInt(poolId)],
      });
      setPoolData(pool);

      // 获取提款信息
      const withdraw = await publicClient.readContract({
        address: contractAddress,
        abi: MetaNodeStakeABI,
        functionName: "withdrawAmount",
        args: [BigInt(poolId), address as `0x${string}`],
      });
      setWithdrawData(withdraw as [bigint, bigint]);

      // 获取当前区块
      const block = await publicClient.getBlockNumber();
      setCurrentBlock(block);
    } catch (error) {
      console.error("Refetch error:", error);
    }
  }, [publicClient, address, contractAddress, poolId, tokenAddress, isETHPool]);

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, 3000);
    return () => clearInterval(interval);
  }, [refetch]);

  // 授权
  const approve = useCallback(async (amount: bigint) => {
    if (!walletClient || !tokenAddress) return;
    setLoading(true);
    try {
      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [contractAddress, amount],
        account: address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await refetch();
    } catch (error) {
      console.error("Approve error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [walletClient, publicClient, tokenAddress, contractAddress, address, refetch]);

  // 质押
  const stake = useCallback(async (amount: bigint) => {
    if (!walletClient) return;
    setLoading(true);
    try {
      let hash;
      if (isETHPool) {
        hash = await walletClient.writeContract({
          address: contractAddress,
          abi: MetaNodeStakeABI,
          functionName: "depositETH",
          account: address as `0x${string}`,
          value: amount,
        });
      } else {
        hash = await walletClient.writeContract({
          address: contractAddress,
          abi: MetaNodeStakeABI,
          functionName: "deposit",
          args: [BigInt(poolId), amount],
          account: address as `0x${string}`,
        });
      }
      await publicClient.waitForTransactionReceipt({ hash });
      await refetch();
    } catch (error) {
      console.error("Stake error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [walletClient, publicClient, contractAddress, poolId, isETHPool, address, refetch]);

  // 取消质押
  const unstake = useCallback(async (amount: bigint) => {
    if (!walletClient) return;
    setLoading(true);
    try {
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: MetaNodeStakeABI,
        functionName: "unstake",
        args: [BigInt(poolId), amount],
        account: address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await refetch();
    } catch (error) {
      console.error("Unstake error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [walletClient, publicClient, contractAddress, poolId, address, refetch]);

  // 领取奖励
  const claim = useCallback(async () => {
    if (!walletClient) return;
    setLoading(true);
    try {
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: MetaNodeStakeABI,
        functionName: "claim",
        args: [BigInt(poolId)],
        account: address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await refetch();
    } catch (error) {
      console.error("Claim error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [walletClient, publicClient, contractAddress, poolId, address, refetch]);

  // 提取
  const withdraw = useCallback(async () => {
    if (!walletClient) return;
    setLoading(true);
    try {
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: MetaNodeStakeABI,
        functionName: "withdraw",
        args: [BigInt(poolId)],
        account: address as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await refetch();
    } catch (error) {
      console.error("Withdraw error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [walletClient, publicClient, contractAddress, poolId, address, refetch]);

  return {
    address,
    chainId,
    loading,
    userBalance,
    stakingBalance,
    allowance,
    pendingRewards,
    poolData,
    withdrawData,
    currentBlock,
    approve,
    stake,
    unstake,
    claim,
    withdraw,
    refetch,
  };
}


