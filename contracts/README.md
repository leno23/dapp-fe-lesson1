# ERC20 Token Contract

这是一个标准的 ERC20 代币合约实现，符合 [EIP-20 标准](https://eips.ethereum.org/EIPS/eip-20)。

## 合约特性

### 基本功能

- ✅ **代币信息**: `name`, `symbol`, `decimals`, `totalSupply`
- ✅ **余额查询**: `balanceOf(address)`
- ✅ **转账功能**: `transfer(address, uint256)`
- ✅ **授权机制**: `approve(address, uint256)`, `allowance(address, address)`
- ✅ **授权转账**: `transferFrom(address, address, uint256)`

### 扩展功能

- ✅ **增加授权**: `increaseAllowance(address, uint256)`
- ✅ **减少授权**: `decreaseAllowance(address, uint256)`

### 安全特性

- ✅ **零地址检查**: 防止向零地址转账或授权
- ✅ **余额检查**: 确保转账金额不超过余额
- ✅ **授权检查**: 确保授权转账不超过授权额度
- ✅ **溢出保护**: 使用 Solidity 0.8+ 的内置溢出检查

## 部署参数

构造函数需要以下参数：

```solidity
constructor(
    string memory _name,        // 代币名称，如 "My Token"
    string memory _symbol,      // 代币符号，如 "MTK"
    uint8 _decimals,           // 小数位数，通常为 18
    uint256 _totalSupply       // 总供应量（不包含小数位）
)
```

## 使用示例

### 部署合约

```solidity
// 部署一个名为 "My Token"，符号为 "MTK"，18位小数，总供应量为 1,000,000 的代币
ERC20Token token = new ERC20Token("My Token", "MTK", 18, 1000000);
```

### 基本操作

```solidity
// 查询余额
uint256 balance = token.balanceOf(userAddress);

// 转账
token.transfer(recipientAddress, amount);

// 授权
token.approve(spenderAddress, amount);

// 授权转账
token.transferFrom(fromAddress, toAddress, amount);
```

## 事件

合约会发出以下事件：

- `Transfer(address indexed from, address indexed to, uint256 value)`: 转账时发出
- `Approval(address indexed owner, address indexed spender, uint256 value)`: 授权时发出

## 注意事项

1. **初始供应量**: 所有代币在部署时分配给合约部署者
2. **小数位处理**: `totalSupply` 会自动乘以 `10^decimals`
3. **授权机制**: 支持无限授权（`type(uint256).max`）
4. **Gas 优化**: 使用 `unchecked` 块优化已验证的算术运算

## 兼容性

- ✅ Solidity ^0.8.19
- ✅ EIP-20 标准
- ✅ OpenZeppelin 兼容
- ✅ 主流钱包支持（MetaMask, Trust Wallet 等）
- ✅ DEX 支持（Uniswap, SushiSwap 等）
