"use client";
import { Card, Button, Space, Typography, message } from "antd";
import { formatEther } from "viem";
import { useEffect, useState } from "react";

const { Title, Text } = Typography;

interface RewardsPanelGenericProps {
  poolId: number;
  stakeHook: any;
}

export default function RewardsPanelGeneric({ poolId, stakeHook }: RewardsPanelGenericProps) {
  const { address, loading, pendingRewards, claim, refetch } = stakeHook;
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async () => {
    try {
      await claim();
      message.success("领取成功");
      setClaimed(true);
      setTimeout(() => setClaimed(false), 2000);
    } catch (error) {
      message.error("领取失败");
    }
  };

  const rewardsAmount = formatEther(pendingRewards);
  const hasRewards = pendingRewards > BigInt(0);

  return (
    <Card title="奖励" size="small" extra={<a onClick={() => refetch()} style={{ fontSize: 12 }}>刷新</a>}>
      <Space direction="vertical" style={{ width: "100%", textAlign: "center" }} size="small">
        <Text type="secondary" style={{ fontSize: 11 }}>待领取</Text>
        <Title level={3} style={{ margin: 0 }}>
          {parseFloat(rewardsAmount).toFixed(4)} <Text type="secondary">META</Text>
        </Title>
        <Text type="secondary" style={{ fontSize: 10 }}>每3秒更新</Text>
        <Button size="small" type="primary" block onClick={handleClaim} loading={loading} disabled={!hasRewards || !address}>
          {!hasRewards ? "暂无奖励" : `领取 ${parseFloat(rewardsAmount).toFixed(4)} META`}
        </Button>
      </Space>
    </Card>
  );
}


