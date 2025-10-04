"use client";
import { useState } from "react";
import { Card, Tabs, Select, Space, Typography, Row, Col } from "antd";
import { useAccount, useReadContract } from "wagmi";
import Navigation from "../components/Navigation";
import { MetaNodeStakeABI } from "@/contracts/MetaNodeStakeABI";
import { ERC20_ABI } from "@/contracts/ERC20ABI";
import { getStakeContractAddress } from "@/utils/constants";
import { useStakeEthers } from "@/hooks/useStakeEthers";
import { useStakeWagmi } from "@/hooks/useStakeWagmi";
import { useStakeViem } from "@/hooks/useStakeViem";
import StakePanel from "../components/stake/StakePanel";
import PoolInfo from "../components/stake/PoolInfo";
import RewardsPanel from "../components/stake/RewardsPanel";
import WithdrawPanel from "../components/stake/WithdrawPanel";

const { Title, Text } = Typography;

function StakeContent({ selectedPoolId, implementation }: { selectedPoolId: number; implementation: string }) {
  const { address, isConnected } = useAccount();
  const chainId = 31337; // 默认本地网络
  const contractAddress = getStakeContractAddress(chainId);

  // 获取池子数据用于判断代币类型
  const { data: poolData } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MetaNodeStakeABI,
    functionName: "pool",
    args: [BigInt(selectedPoolId)],
  });

  const tokenAddress = poolData?.[0];
  const isETHPool = tokenAddress === "0x0000000000000000000000000000000000000000";

  // 根据选择的实现方式使用不同的 hook
  const ethersHook = useStakeEthers(selectedPoolId, tokenAddress, isETHPool);
  const wagmiHook = useStakeWagmi(selectedPoolId, tokenAddress, isETHPool);
  const viemHook = useStakeViem(selectedPoolId, tokenAddress, isETHPool);
  const map = {
    ethers: ethersHook,
    wagmi: wagmiHook,
    viem: viemHook,
  }

  const currentHook = map[implementation as keyof typeof map];

  if (!isConnected) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Title level={3}>请先连接钱包</Title>
          <Text type="secondary">连接您的钱包以开始使用质押功能</Text>
        </div>
      </Card>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={8}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <PoolInfo poolId={selectedPoolId} stakeHook={currentHook} />
        </Space>
      </Col>
      <Col xs={24} lg={8}>
        <StakePanel poolId={selectedPoolId} isETHPool={isETHPool} stakeHook={currentHook} />
      </Col>
      <Col xs={24} lg={8}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <RewardsPanel poolId={selectedPoolId} stakeHook={currentHook} />
          <WithdrawPanel poolId={selectedPoolId} stakeHook={currentHook} />
        </Space>
      </Col>
    </Row>
  );
}

export default function StakePage() {
  const chainId = 31337;
  const contractAddress = getStakeContractAddress(chainId);
  const [selectedPoolId, setSelectedPoolId] = useState(0);

  const { data: poolLength } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MetaNodeStakeABI,
    functionName: "poolLength",
  });

  const { data: startBlock } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MetaNodeStakeABI,
    functionName: "startBlock",
  });

  const { data: endBlock } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MetaNodeStakeABI,
    functionName: "endBlock",
  });

  const { data: metaNodePerBlock } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MetaNodeStakeABI,
    functionName: "MetaNodePerBlock",
  });

  const poolCount = poolLength ? Number(poolLength) : 0;

  // 获取所有池子的代币符号
  const poolOptions = Array.from({ length: poolCount }, (_, i) => {
    return { value: i, label: `池子 #${i}` };
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Navigation />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>MetaNode 质押挖矿</Title>
          <Text type="secondary">质押代币，赚取 MetaNode 奖励</Text>
        </div>

        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Text type="secondary">开始区块</Text>
              <div><Text strong>{startBlock?.toString() || "..."}</Text></div>
            </Col>
            <Col span={6}>
              <Text type="secondary">结束区块</Text>
              <div><Text strong>{endBlock?.toString() || "..."}</Text></div>
            </Col>
            <Col span={6}>
              <Text type="secondary">每区块奖励</Text>
              <div><Text strong>{metaNodePerBlock ? (Number(metaNodePerBlock) / 1e18).toFixed(2) : "..."} META</Text></div>
            </Col>
            <Col span={6}>
              <Text type="secondary">质押池数量</Text>
              <div><Text strong>{poolCount}</Text></div>
            </Col>
          </Row>
        </Card>

        {poolCount > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text style={{ marginRight: 8 }}>选择质押池:</Text>
            <Select
              value={selectedPoolId}
              onChange={setSelectedPoolId}
              options={poolOptions}
              style={{ width: 200 }}
            />
          </div>
        )}

        <Tabs
          defaultActiveKey="ethers"
          items={[
            {
              key: "ethers",
              label: "Ethers.js",
              children: <StakeContent selectedPoolId={selectedPoolId} implementation="ethers" />,
            },
            {
              key: "wagmi",
              label: "Wagmi",
              children: <StakeContent selectedPoolId={selectedPoolId} implementation="wagmi" />,
            },
            {
              key: "viem",
              label: "Viem",
              children: <StakeContent selectedPoolId={selectedPoolId} implementation="viem" />,
            },
          ]}
        />

        <Card style={{ marginTop: 24 }} size="small">
          <Text type="secondary" style={{ fontSize: 12 }}>
            合约地址: <code>{contractAddress}</code>
          </Text>
        </Card>
      </div>
    </div>
  );
}
