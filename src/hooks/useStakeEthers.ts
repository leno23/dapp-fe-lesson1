import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { MetaNodeStakeABI } from "@/contracts/MetaNodeStakeABI";
import { ERC20_ABI } from "@/contracts/ERC20ABI";
import { getStakeContractAddress } from "@/utils/constants";

export function useStakeEthers(poolId: number, tokenAddress?: string, isETHPool = false) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
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

  // 初始化
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const prov = new ethers.BrowserProvider(window.ethereum);
      setProvider(prov);

      prov.getSigner().then(setSigner).catch(console.error);
      prov.getSigner().then(s => s.getAddress()).then(setAddress).catch(console.error);
      prov.getNetwork().then(n => setChainId(Number(n.chainId))).catch(console.error);
    }
  }, []);

  const contractAddress = chainId ? getStakeContractAddress(chainId) : "";

  // 刷新数据
  const refetch = useCallback(async () => {
    if (!provider || !address || !contractAddress) return;

    try {
      const contract = new ethers.Contract(contractAddress, MetaNodeStakeABI, provider);

      // 获取余额
      if (isETHPool) {
        const bal = await provider.getBalance(address);
        setUserBalance(bal);
      } else if (tokenAddress) {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const bal = await tokenContract.balanceOf(address);
        setUserBalance(bal);
        const allow = await tokenContract.allowance(address, contractAddress);
        setAllowance(allow);
      }

      // 获取质押余额
      const stBal = await contract.stakingBalance(poolId, address);
      setStakingBalance(stBal);

      // 获取待领取奖励
      const pending = await contract.pendingMetaNode(poolId, address);
      setPendingRewards(pending);

      // 获取池子信息
      const pool = await contract.pool(poolId);
      setPoolData(pool);

      // 获取提款信息
      const withdraw = await contract.withdrawAmount(poolId, address);
      setWithdrawData(withdraw);

      // 获取当前区块
      const block = await provider.getBlockNumber();
      setCurrentBlock(BigInt(block));
    } catch (error) {
      console.error("Refetch error:", error);
    }
  }, [provider, address, contractAddress, poolId, tokenAddress, isETHPool]);

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, 3000);
    return () => clearInterval(interval);
  }, [refetch]);

  // 授权
  const approve = useCallback(async (amount: bigint) => {
    if (!signer || !tokenAddress) return;
    setLoading(true);
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const tx = await tokenContract.approve(contractAddress, amount);
      await tx.wait();
      await refetch();
    } catch (error) {
      console.error("Approve error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, tokenAddress, contractAddress, refetch]);

  // 质押
  const stake = useCallback(async (amount: bigint) => {
    if (!signer) return;
    setLoading(true);
    try {
      const contract = new ethers.Contract(contractAddress, MetaNodeStakeABI, signer);
      let tx;
      if (isETHPool) {
        tx = await contract.depositETH({ value: amount });
      } else {
        tx = await contract.deposit(poolId, amount);
      }
      await tx.wait();
      await refetch();
    } catch (error) {
      console.error("Stake error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, contractAddress, poolId, isETHPool, refetch]);

  // 取消质押
  const unstake = useCallback(async (amount: bigint) => {
    if (!signer) return;
    setLoading(true);
    try {
      const contract = new ethers.Contract(contractAddress, MetaNodeStakeABI, signer);
      const tx = await contract.unstake(poolId, amount);
      await tx.wait();
      await refetch();
    } catch (error) {
      console.error("Unstake error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, contractAddress, poolId, refetch]);

  // 领取奖励
  const claim = useCallback(async () => {
    if (!signer) return;
    setLoading(true);
    try {
      const contract = new ethers.Contract(contractAddress, MetaNodeStakeABI, signer);
      const tx = await contract.claim(poolId);
      await tx.wait();
      await refetch();
    } catch (error) {
      console.error("Claim error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, contractAddress, poolId, refetch]);

  // 提取
  const withdraw = useCallback(async () => {
    if (!signer) return;
    setLoading(true);
    try {
      const contract = new ethers.Contract(contractAddress, MetaNodeStakeABI, signer);
      const tx = await contract.withdraw(poolId);
      await tx.wait();
      await refetch();
    } catch (error) {
      console.error("Withdraw error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, contractAddress, poolId, refetch]);

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


