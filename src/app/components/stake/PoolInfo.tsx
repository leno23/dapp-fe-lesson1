"use client";
import { Card, Descriptions, Space, Typography, Divider } from "antd";
import { formatEther } from "viem";
import { ERC20_ABI } from "@/contracts/ERC20ABI";
import { useReadContract } from "wagmi";

const { Text } = Typography;

interface PoolInfoGenericProps {
  poolId: number;
  stakeHook: any;
}

export default function PoolInfoGeneric({ poolId, stakeHook }: PoolInfoGenericProps) {
  const { address, poolData, stakingBalance, pendingRewards, withdrawData } = stakeHook;

  const tokenAddress = poolData?.[0];
  const isETHPool = tokenAddress === "0x0000000000000000000000000000000000000000";
  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { enabled: !isETHPool && !!tokenAddress },
  });

  if (!poolData) return <Card size="small" loading />;

  const [, poolWeight, lastRewardBlock, , stTokenAmount, minDepositAmount, unstakeLockedBlocks] = poolData;
  const displaySymbol = isETHPool ? "ETH" : (tokenSymbol as string || "Token");

  return (
    <Card title={`${displaySymbol} 池 #${poolId}`} size="small" extra={<Text type="secondary" style={{ fontSize: 12 }}>权重: {poolWeight?.toString()}</Text>}>
      <Descriptions column={2} size="small">
        <Descriptions.Item label="TVL">{formatEther(stTokenAmount || BigInt(0))}</Descriptions.Item>
        <Descriptions.Item label="最小质押">{formatEther(minDepositAmount || BigInt(0))}</Descriptions.Item>
        <Descriptions.Item label="锁定区块">{unstakeLockedBlocks?.toString()}</Descriptions.Item>
        <Descriptions.Item label="奖励区块">{lastRewardBlock?.toString()}</Descriptions.Item>
      </Descriptions>

      {address && (
        <>
          <Divider style={{ margin: "12px 0" }}>我的数据</Divider>
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12 }}>质押</Text>
              <Text strong style={{ fontSize: 12 }}>{formatEther(stakingBalance)} {displaySymbol}</Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12 }}>奖励</Text>
              <Text strong type="success" style={{ fontSize: 12 }}>{formatEther(pendingRewards)} META</Text>
            </div>
            {withdrawData && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 12 }}>解锁请求</Text>
                  <Text strong style={{ fontSize: 12 }}>{formatEther(withdrawData[0])}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 12 }}>可提取</Text>
                  <Text strong type="warning" style={{ fontSize: 12 }}>{formatEther(withdrawData[1])}</Text>
                </div>
              </>
            )}
          </Space>
        </>
      )}
    </Card>
  );
}


