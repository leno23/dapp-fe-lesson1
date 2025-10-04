"use client";
import { Card, Button, Descriptions, Alert, Space, message } from "antd";
import { formatEther } from "viem";

interface WithdrawPanelGenericProps {
  poolId: number;
  stakeHook: any;
}

export default function WithdrawPanelGeneric({ poolId, stakeHook }: WithdrawPanelGenericProps) {
  const { address, loading, withdrawData, poolData, currentBlock, withdraw, refetch } = stakeHook;

  const handleWithdraw = async () => {
    try {
      await withdraw();
      message.success("提取成功");
    } catch (error) {
      message.error("提取失败");
    }
  };

  const [requestAmount, pendingWithdrawAmount] = withdrawData;
  const lockedAmount = requestAmount - pendingWithdrawAmount;
  const hasUnlockedAmount = pendingWithdrawAmount > BigInt(0);
  const unstakeLockedBlocks = poolData?.[6] || BigInt(0);

  return (
    <Card title="提取" size="small" extra={<a onClick={() => refetch()} style={{ fontSize: 12 }}>刷新</a>}>
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="总请求">{formatEther(BigInt(requestAmount))}</Descriptions.Item>
          <Descriptions.Item label="可提取">{formatEther(BigInt(pendingWithdrawAmount))}</Descriptions.Item>
          <Descriptions.Item label="锁定中">{formatEther(BigInt(lockedAmount))}</Descriptions.Item>
          <Descriptions.Item label="当前区块">{currentBlock ? currentBlock.toString() : ""}</Descriptions.Item>
        </Descriptions>

        <Alert message={`取消质押需等待 ${unstakeLockedBlocks.toString()} 个区块后可提取`} type="info" showIcon style={{ fontSize: 11 }} />

        {!hasUnlockedAmount && lockedAmount > BigInt(0) && (
          <Alert message="代币锁定中，请等待区块确认" type="warning" showIcon style={{ fontSize: 11 }} />
        )}

        <Button size="small" type="primary" block onClick={handleWithdraw} loading={loading} disabled={!hasUnlockedAmount || !address}>
          {!hasUnlockedAmount ? "暂无可提取" : `提取 ${formatEther(pendingWithdrawAmount)}`}
        </Button>
      </Space>
    </Card>
  );
}


