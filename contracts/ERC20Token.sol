// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
// 实现一个标准的ERC20代币合约
contract ERC20Token {
    // 代币基本信息
    string public name;        // 代币名称
    string public symbol;      // 代币符号
    uint8 public decimals;     // 小数位数
    uint256 public totalSupply; // 总供应量
    
    // 余额映射
    mapping(address => uint256) private _balances;
    // 授权映射
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // 转账事件
    event Transfer(address indexed from, address indexed to, uint256 value);
    // 授权事件
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // 构造函数：初始化代币信息并将所有代币分配给部署者
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply * 10**_decimals;
        _balances[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    // 1.查询代币总供应量
    function totalSupply() public view returns (uint256) {
        return totalSupply;
    }
    
    
    // 2.查询账户余额
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    // 3.转账给指定地址
    function transfer(address to, uint256 amount) public returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }
    
    // 4.查询授权额度  owner给spend授权的代币额度
    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }
    
    // 5.给指定spender授权amount代币
    function approve(address spender, uint256 amount) public returns (bool) {
        address owner = msg.sender;
        _approve(owner, spender, amount);
        return true;
    }
    
    // 6.从授权地址转账
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }
    
    // 转账函数，带检查和优化溢出
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        
        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        // 使用unchecked避免溢出检查，提高性能，节省gas，但需要确保不会溢出，所以需要确保fromBalance >= amount
        // 如果fromBalance >= amount，则可以进行转账，否则会抛出异常
        unchecked {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        }
        
        emit Transfer(from, to, amount);
    }
    
    // 授权函数，带检查和优化溢出
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
    
    // 消费授权函数，带检查和优化溢出
    function _spendAllowance(address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }
}
