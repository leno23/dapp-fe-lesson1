"use client";
import { useState } from "react";
import { Card, Tabs, Input, Button, Space, Typography } from "antd";
import { parseEther, formatEther } from "viem";

const { Text } = Typography;

interface StakePanelGenericProps {
  poolId: number;
  isETHPool?: boolean;
  stakeHook: any;
}

export default function StakePanelGeneric({ poolId, isETHPool = false, stakeHook }: StakePanelGenericProps) {
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  const { address, loading, userBalance, stakingBalance, allowance, approve, stake, unstake } = stakeHook;

  const handleApprove = () => {
    if (!stakeAmount) return;
    approve(parseEther(stakeAmount));
  };

  const handleStake = () => {
    if (!stakeAmount) return;
    stake(parseEther(stakeAmount));
    setStakeAmount("");
  };

  const handleUnstake = () => {
    if (!unstakeAmount) return;
    unstake(parseEther(unstakeAmount));
    setUnstakeAmount("");
  };

  const needsApproval = !isETHPool && stakeAmount && allowance < parseEther(stakeAmount || "0");

  return (
    <Card title="质押操作" size="small">
      <Tabs
        size="small"
        items={[
          {
            key: "stake",
            label: "质押",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size="small">
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text>质押数量</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>余额: {formatEther(userBalance)}</Text>
                  </div>
                  <Input
                    size="small"
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.0"
                    addonAfter={<a onClick={() => setStakeAmount(formatEther(userBalance))}>MAX</a>}
                  />
                </div>
                {!isETHPool && needsApproval ? (
                  <Button size="small" type="primary" block onClick={handleApprove} loading={loading} disabled={!stakeAmount}>
                    授权
                  </Button>
                ) : (
                  <Button size="small" type="primary" block onClick={handleStake} loading={loading} disabled={!stakeAmount || !address}>
                    质押
                  </Button>
                )}
              </Space>
            ),
          },
          {
            key: "unstake",
            label: "取消质押",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size="small">
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text>取消质押数量</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>已质押: {formatEther(stakingBalance)}</Text>
                  </div>
                  <Input
                    size="small"
                    type="number"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    placeholder="0.0"
                    addonAfter={<a onClick={() => setUnstakeAmount(formatEther(stakingBalance))}>MAX</a>}
                  />
                </div>
                <Text type="warning" style={{ fontSize: 11 }}>取消质押后需要等待锁定期</Text>
                <Button size="small" type="primary" danger block onClick={handleUnstake} loading={loading} disabled={!unstakeAmount || !address}>
                  取消质押
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}


