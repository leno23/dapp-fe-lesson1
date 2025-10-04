import { useCallback } from "react";
import { useAccount, useChainId, useReadContract, useBalance, useWriteContract, useWaitForTransactionReceipt, useBlockNumber } from "wagmi";
import { MetaNodeStakeABI } from "@/contracts/MetaNodeStakeABI";
import { ERC20_ABI } from "@/contracts/ERC20ABI";
import { getStakeContractAddress } from "@/utils/constants";

export function useStakeWagmi(poolId: number, tokenAddress?: string, isETHPool = false) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contractAddress = getStakeContractAddress(chainId);

  // 余额查询
  const { data: ethBalance } = useBalance({ address });
  const { data: tokenBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !isETHPool && !!address && !!tokenAddress },
  });

  // 质押余额
  const { data: stakingBalance, refetch: refetchStaking } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MetaNodeStakeABI,
    functionName: "stakingBalance",
    args: [BigInt(poolId), address!],
    query: { enabled: !!address },
  });

  // 授权额度
  const { data: allowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address!, contractAddress as `0x${string}`],
    query: { enabled: !isETHPool && !!address && !!tokenAddress },
  });

  // 待领取奖励
  const { data: pendingRewards, refetch: refetchRewards } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MetaNodeStakeABI,
    functionName: "pendingMetaNode",
    args: [BigInt(poolId), address!],
    query: { enabled: !!address, refetchInterval: 3000 },
  });

  // 池子信息
  const { data: poolData } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MetaNodeStakeABI,
    functionName: "pool",
    args: [BigInt(poolId)],
  });

  // 提款信息
  const { data: withdrawData, refetch: refetchWithdraw } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MetaNodeStakeABI,
    functionName: "withdrawAmount",
    args: [BigInt(poolId), address!],
    query: { enabled: !!address },
  });

  // 当前区块
  const { data: currentBlock } = useBlockNumber({ watch: true });

  // 写操作
  const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending } = useWriteContract();
  const { writeContract: writeDepositETH, isPending: isDepositETHPending } = useWriteContract();
  const { writeContract: writeDeposit, isPending: isDepositPending } = useWriteContract();
  const { writeContract: writeUnstake, isPending: isUnstakePending } = useWriteContract();
  const { writeContract: writeClaim, isPending: isClaimPending } = useWriteContract();
  const { writeContract: writeWithdraw, isPending: isWithdrawPending } = useWriteContract();

  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  // 封装操作
  const approve = useCallback(async (amount: bigint) => {
    if (!tokenAddress) return;
    writeApprove({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [contractAddress as `0x${string}`, amount],
    });
  }, [tokenAddress, contractAddress, writeApprove]);

  const stake = useCallback(async (amount: bigint) => {
    if (isETHPool) {
      writeDepositETH({
        address: contractAddress as `0x${string}`,
        abi: MetaNodeStakeABI,
        functionName: "depositETH",
        value: amount,
      });
    } else {
      writeDeposit({
        address: contractAddress as `0x${string}`,
        abi: MetaNodeStakeABI,
        functionName: "deposit",
        args: [BigInt(poolId), amount],
      });
    }
  }, [isETHPool, contractAddress, poolId, writeDepositETH, writeDeposit]);

  const unstake = useCallback(async (amount: bigint) => {
    writeUnstake({
      address: contractAddress as `0x${string}`,
      abi: MetaNodeStakeABI,
      functionName: "unstake",
      args: [BigInt(poolId), amount],
    });
  }, [contractAddress, poolId, writeUnstake]);

  const claim = useCallback(async () => {
    writeClaim({
      address: contractAddress as `0x${string}`,
      abi: MetaNodeStakeABI,
      functionName: "claim",
      args: [BigInt(poolId)],
    });
  }, [contractAddress, poolId, writeClaim]);

  const withdraw = useCallback(async () => {
    writeWithdraw({
      address: contractAddress as `0x${string}`,
      abi: MetaNodeStakeABI,
      functionName: "withdraw",
      args: [BigInt(poolId)],
    });
  }, [contractAddress, poolId, writeWithdraw]);

  const refetch = useCallback(() => {
    refetchStaking();
    refetchRewards();
    refetchWithdraw();
  }, [refetchStaking, refetchRewards, refetchWithdraw]);

  return {
    address: address || "",
    chainId,
    loading: isApprovePending || isDepositETHPending || isDepositPending || isUnstakePending || isClaimPending || isWithdrawPending,
    userBalance: isETHPool ? ethBalance?.value || BigInt(0) : tokenBalance || BigInt(0),
    stakingBalance: stakingBalance || BigInt(0),
    allowance: allowance || BigInt(0),
    pendingRewards: pendingRewards || BigInt(0),
    poolData,
    withdrawData: withdrawData || [BigInt(0), BigInt(0)],
    currentBlock: currentBlock || BigInt(0),
    approve,
    stake,
    unstake,
    claim,
    withdraw,
    refetch,
  };
}


