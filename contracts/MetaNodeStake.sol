// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title MetaNodeStake - 质押挖矿合约
 * @notice 多池子质押系统，用户可质押ETH或ERC20代币以获得MetaNode奖励
 * @dev 基于MasterChef模式的质押挖矿合约，实现以下核心功能：
 * 
 * ## 主要特性
 * - 支持多个质押池，每个池可配置不同的代币、权重和参数
 * - 支持ETH质押（固定为池子ID 0）和ERC20代币质押
 * - 基于区块高度的线性奖励释放机制
 * - 两步提款流程：取消质押 + 锁定期 + 提款
 * - UUPS可升级代理模式
 * - 基于角色的访问控制（RBAC）
 * - 紧急暂停功能
 * 
 * ## 奖励机制
 * - 每个区块产出固定数量的MetaNode奖励
 * - 按池子权重分配到各个池子
 * - 按用户质押占比分配到用户
 * - 奖励公式：pending = (user.stAmount * pool.accMetaNodePerST) / 1e18 - user.finishedMetaNode
 * 
 * ## 使用流程
 * 1. 管理员：初始化合约，添加质押池
 * 2. 用户质押：调用deposit()或depositETH()
 * 3. 累积奖励：区块增长自动累积奖励
 * 4. 领取奖励：调用claim()领取MetaNode代币
 * 5. 取消质押：调用unstake()发起解锁请求
 * 6. 提款：锁定期过后调用withdraw()提取代币
 * 
 * @author MetaNode Team
 * @custom:security-contact security@metanode.io
 */
contract MetaNodeStake is
    Initializable,
    UUPSUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable
{
    using SafeERC20 for IERC20;
    using Address for address;
    using Math for uint256;

    // ************************************** INVARIANT **************************************

    /// @notice 管理员角色标识符，拥有合约管理权限
    bytes32 public constant ADMIN_ROLE = keccak256("admin_role");
    
    /// @notice 升级角色标识符，拥有合约升级权限
    bytes32 public constant UPGRADE_ROLE = keccak256("upgrade_role");

    /// @notice ETH质押池的固定ID，始终为0
    uint256 public constant ETH_PID = 0;
    
    // ************************************** DATA STRUCTURE **************************************
    /*
    奖励计算机制说明：
    在任何时间点，用户应得但待分发的MetaNode数量计算公式为：
    
    待领取奖励 = (user.stAmount * pool.accMetaNodePerST) - user.finishedMetaNode

    当用户存入或取出质押代币时，会发生以下操作：
    1. 更新池子的 `accMetaNodePerST`（累积每份奖励）和 `lastRewardBlock`（最后奖励区块）
    2. 计算并累积用户的待领取奖励
    3. 更新用户的 `stAmount`（质押数量）
    4. 更新用户的 `finishedMetaNode`（已结算奖励）
    */
    
    /// @notice 质押池结构体
    struct Pool {
        /// @notice 质押代币地址（address(0x0)表示ETH）
        address stTokenAddress;
        /// @notice 池子权重，决定该池在总奖励中的分配比例
        uint256 poolWeight;
        /// @notice 最后一次发放奖励的区块号
        uint256 lastRewardBlock;
        /// @notice 累积的每单位质押代币可获得的MetaNode奖励（乘以1e18精度）
        uint256 accMetaNodePerST;
        /// @notice 池子中的总质押代币数量
        uint256 stTokenAmount;
        /// @notice 最小质押数量限制
        uint256 minDepositAmount;
        /// @notice 取消质押后的锁定区块数
        uint256 unstakeLockedBlocks;
    }

    /// @notice 取消质押请求结构体
    struct UnstakeRequest {
        /// @notice 请求取出的代币数量
        uint256 amount;
        /// @notice 可以提取的解锁区块高度
        uint256 unlockBlocks;
    }

    /// @notice 用户信息结构体
    struct User {
        /// @notice 用户当前质押的代币数量
        uint256 stAmount;
        /// @notice 已结算给用户的MetaNode奖励数量（用于奖励计算）
        uint256 finishedMetaNode;
        /// @notice 待领取的MetaNode奖励数量（已累积但未领取）
        uint256 pendingMetaNode;
        /// @notice 用户的取消质押请求列表
        UnstakeRequest[] requests;
    }

    // ************************************** STATE VARIABLES **************************************
    
    /// @notice 质押挖矿开始的区块号
    uint256 public startBlock;
    
    /// @notice 质押挖矿结束的区块号
    uint256 public endBlock;
    
    /// @notice 每个区块产出的MetaNode代币奖励数量
    uint256 public MetaNodePerBlock;

    /// @notice 提款功能是否暂停
    bool public withdrawPaused;
    
    /// @notice 领取奖励功能是否暂停
    bool public claimPaused;

    /// @notice MetaNode奖励代币合约接口
    IERC20 public MetaNode;

    /// @notice 所有池子的总权重（用于计算各池奖励分配比例）
    uint256 public totalPoolWeight;
    
    /// @notice 所有质押池的数组
    Pool[] public pool;

    /// @notice 用户信息映射：池子ID => 用户地址 => 用户信息
    mapping (uint256 => mapping (address => User)) public user;

    // ************************************** EVENT **************************************

    /// @notice 设置MetaNode代币地址时触发
    /// @param MetaNode MetaNode代币合约地址
    event SetMetaNode(IERC20 indexed MetaNode);

    /// @notice 暂停提款功能时触发
    event PauseWithdraw();

    /// @notice 恢复提款功能时触发
    event UnpauseWithdraw();

    /// @notice 暂停领取奖励功能时触发
    event PauseClaim();

    /// @notice 恢复领取奖励功能时触发
    event UnpauseClaim();

    /// @notice 设置开始区块时触发
    /// @param startBlock 新的开始区块号
    event SetStartBlock(uint256 indexed startBlock);

    /// @notice 设置结束区块时触发
    /// @param endBlock 新的结束区块号
    event SetEndBlock(uint256 indexed endBlock);

    /// @notice 设置每区块奖励数量时触发
    /// @param MetaNodePerBlock 新的每区块奖励数量
    event SetMetaNodePerBlock(uint256 indexed MetaNodePerBlock);

    /// @notice 添加新质押池时触发
    /// @param stTokenAddress 质押代币地址
    /// @param poolWeight 池子权重
    /// @param lastRewardBlock 最后奖励区块
    /// @param minDepositAmount 最小质押数量
    /// @param unstakeLockedBlocks 取消质押锁定区块数
    event AddPool(address indexed stTokenAddress, uint256 indexed poolWeight, uint256 indexed lastRewardBlock, uint256 minDepositAmount, uint256 unstakeLockedBlocks);

    /// @notice 更新池子信息时触发
    /// @param poolId 池子ID
    /// @param minDepositAmount 新的最小质押数量
    /// @param unstakeLockedBlocks 新的锁定区块数
    event UpdatePoolInfo(uint256 indexed poolId, uint256 indexed minDepositAmount, uint256 indexed unstakeLockedBlocks);

    /// @notice 设置池子权重时触发
    /// @param poolId 池子ID
    /// @param poolWeight 新的池子权重
    /// @param totalPoolWeight 更新后的总权重
    event SetPoolWeight(uint256 indexed poolId, uint256 indexed poolWeight, uint256 totalPoolWeight);

    /// @notice 更新池子奖励时触发
    /// @param poolId 池子ID
    /// @param lastRewardBlock 最后奖励区块
    /// @param totalMetaNode 本次更新产生的总奖励
    event UpdatePool(uint256 indexed poolId, uint256 indexed lastRewardBlock, uint256 totalMetaNode);

    /// @notice 用户存入质押代币时触发
    /// @param user 用户地址
    /// @param poolId 池子ID
    /// @param amount 存入数量
    event Deposit(address indexed user, uint256 indexed poolId, uint256 amount);

    /// @notice 用户请求取消质押时触发
    /// @param user 用户地址
    /// @param poolId 池子ID
    /// @param amount 取消质押数量
    event RequestUnstake(address indexed user, uint256 indexed poolId, uint256 amount);

    /// @notice 用户提取已解锁的代币时触发
    /// @param user 用户地址
    /// @param poolId 池子ID
    /// @param amount 提取数量
    /// @param blockNumber 提取时的区块号
    event Withdraw(address indexed user, uint256 indexed poolId, uint256 amount, uint256 indexed blockNumber);

    /// @notice 用户领取奖励时触发
    /// @param user 用户地址
    /// @param poolId 池子ID
    /// @param MetaNodeReward 领取的奖励数量
    event Claim(address indexed user, uint256 indexed poolId, uint256 MetaNodeReward);

    // ************************************** MODIFIER **************************************

    /// @notice 检查池子ID是否有效
    /// @param _pid 池子ID
    modifier checkPid(uint256 _pid) {
        require(_pid < pool.length, "invalid pid");
        _;
    }

    /// @notice 检查领取功能是否未暂停
    modifier whenNotClaimPaused() {
        require(!claimPaused, "claim is paused");
        _;
    }

    /// @notice 检查提款功能是否未暂停
    modifier whenNotWithdrawPaused() {
        require(!withdrawPaused, "withdraw is paused");
        _;
    }

    /**
     * @notice 初始化合约，设置MetaNode代币地址和基本挖矿参数
     * @dev 使用initializer修饰符确保只能调用一次
     * @param _MetaNode MetaNode奖励代币合约地址
     * @param _startBlock 挖矿开始区块号
     * @param _endBlock 挖矿结束区块号
     * @param _MetaNodePerBlock 每个区块产出的奖励数量
     */
    function initialize(
        IERC20 _MetaNode,
        uint256 _startBlock,
        uint256 _endBlock,
        uint256 _MetaNodePerBlock
    ) public initializer {
        require(_startBlock <= _endBlock && _MetaNodePerBlock > 0, "invalid parameters");

        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADE_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        setMetaNode(_MetaNode);

        startBlock = _startBlock;
        endBlock = _endBlock;
        MetaNodePerBlock = _MetaNodePerBlock;

    }

    /**
     * @notice UUPS升级授权函数
     * @dev 只有拥有UPGRADE_ROLE的地址才能升级合约
     * @param newImplementation 新实现合约的地址
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADE_ROLE)
        override
    {

    }

    // ************************************** ADMIN FUNCTION **************************************

    /**
     * @notice 设置MetaNode奖励代币地址
     * @dev 只能由管理员调用
     * @param _MetaNode MetaNode代币合约地址
     */
    function setMetaNode(IERC20 _MetaNode) public onlyRole(ADMIN_ROLE) {
        MetaNode = _MetaNode;

        emit SetMetaNode(MetaNode);
    }

    /**
     * @notice 暂停提款功能
     * @dev 只能由管理员调用，用于紧急情况
     */
    function pauseWithdraw() public onlyRole(ADMIN_ROLE) {
        require(!withdrawPaused, "withdraw has been already paused");

        withdrawPaused = true;

        emit PauseWithdraw();
    }

    /**
     * @notice 恢复提款功能
     * @dev 只能由管理员调用
     */
    function unpauseWithdraw() public onlyRole(ADMIN_ROLE) {
        require(withdrawPaused, "withdraw has been already unpaused");

        withdrawPaused = false;

        emit UnpauseWithdraw();
    }

    /**
     * @notice 暂停领取奖励功能
     * @dev 只能由管理员调用，用于紧急情况
     */
    function pauseClaim() public onlyRole(ADMIN_ROLE) {
        require(!claimPaused, "claim has been already paused");

        claimPaused = true;

        emit PauseClaim();
    }

    /**
     * @notice 恢复领取奖励功能
     * @dev 只能由管理员调用
     */
    function unpauseClaim() public onlyRole(ADMIN_ROLE) {
        require(claimPaused, "claim has been already unpaused");

        claimPaused = false;

        emit UnpauseClaim();
    }

    /**
     * @notice 更新质押挖矿开始区块
     * @dev 只能由管理员调用，开始区块必须小于等于结束区块
     * @param _startBlock 新的开始区块号
     */
    function setStartBlock(uint256 _startBlock) public onlyRole(ADMIN_ROLE) {
        require(_startBlock <= endBlock, "start block must be smaller than end block");

        startBlock = _startBlock;

        emit SetStartBlock(_startBlock);
    }

    /**
     * @notice 更新质押挖矿结束区块
     * @dev 只能由管理员调用，结束区块必须大于等于开始区块
     * @param _endBlock 新的结束区块号
     */
    function setEndBlock(uint256 _endBlock) public onlyRole(ADMIN_ROLE) {
        require(startBlock <= _endBlock, "start block must be smaller than end block");

        endBlock = _endBlock;

        emit SetEndBlock(_endBlock);
    }

    /**
     * @notice 更新每个区块产出的MetaNode奖励数量
     * @dev 只能由管理员调用
     * @param _MetaNodePerBlock 新的每区块奖励数量，必须大于0
     */
    function setMetaNodePerBlock(uint256 _MetaNodePerBlock) public onlyRole(ADMIN_ROLE) {
        require(_MetaNodePerBlock > 0, "invalid parameter");

        MetaNodePerBlock = _MetaNodePerBlock;

        emit SetMetaNodePerBlock(_MetaNodePerBlock);
    }

    /**
     * @notice 添加新的质押池
     * @dev 只能由管理员调用
     *      警告：请勿添加相同的质押代币超过一次，否则奖励分配会出现问题
     *      第一个池子必须是ETH池（地址为0x0），后续池子必须是非零地址
     * @param _stTokenAddress 质押代币地址，ETH为address(0x0)
     * @param _poolWeight 池子权重，决定该池在总奖励中的分配比例
     * @param _minDepositAmount 最小质押数量（可以为0）
     * @param _unstakeLockedBlocks 取消质押后的锁定区块数，必须大于0
     * @param _withUpdate 是否在添加前更新所有池子的奖励
     */
    function addPool(address _stTokenAddress, uint256 _poolWeight, uint256 _minDepositAmount, uint256 _unstakeLockedBlocks,  bool _withUpdate) public onlyRole(ADMIN_ROLE) {
        // 第一个池子必须是ETH池，后续池子不能是ETH
        if (pool.length > 0) {
            require(_stTokenAddress != address(0x0), "invalid staking token address");
        } else {
            require(_stTokenAddress == address(0x0), "invalid staking token address");
        }
        // 允许最小质押数量为0
        //require(_minDepositAmount > 0, "invalid min deposit amount");
        require(_unstakeLockedBlocks > 0, "invalid withdraw locked blocks");
        require(block.number < endBlock, "Already ended");

        if (_withUpdate) {
            massUpdatePools();
        }

        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalPoolWeight = totalPoolWeight + _poolWeight;

        pool.push(Pool({
            stTokenAddress: _stTokenAddress,
            poolWeight: _poolWeight,
            lastRewardBlock: lastRewardBlock,
            accMetaNodePerST: 0,
            stTokenAmount: 0,
            minDepositAmount: _minDepositAmount,
            unstakeLockedBlocks: _unstakeLockedBlocks
        }));

        emit AddPool(_stTokenAddress, _poolWeight, lastRewardBlock, _minDepositAmount, _unstakeLockedBlocks);
    }

    /**
     * @notice 更新指定池子的配置信息
     * @dev 只能由管理员调用，可更新最小质押数量和锁定区块数
     * @param _pid 池子ID
     * @param _minDepositAmount 新的最小质押数量
     * @param _unstakeLockedBlocks 新的解锁等待区块数
     */
    function updatePool(uint256 _pid, uint256 _minDepositAmount, uint256 _unstakeLockedBlocks) public onlyRole(ADMIN_ROLE) checkPid(_pid) {
        pool[_pid].minDepositAmount = _minDepositAmount;
        pool[_pid].unstakeLockedBlocks = _unstakeLockedBlocks;

        emit UpdatePoolInfo(_pid, _minDepositAmount, _unstakeLockedBlocks);
    }

    /**
     * @notice 更新指定池子的权重
     * @dev 只能由管理员调用，权重改变会影响奖励分配比例
     * @param _pid 池子ID
     * @param _poolWeight 新的池子权重，必须大于0
     * @param _withUpdate 是否在修改前更新所有池子的奖励
     */
    function setPoolWeight(uint256 _pid, uint256 _poolWeight, bool _withUpdate) public onlyRole(ADMIN_ROLE) checkPid(_pid) {
        require(_poolWeight > 0, "invalid pool weight");
        
        if (_withUpdate) {
            massUpdatePools();
        }

        totalPoolWeight = totalPoolWeight - pool[_pid].poolWeight + _poolWeight;
        pool[_pid].poolWeight = _poolWeight;

        emit SetPoolWeight(_pid, _poolWeight, totalPoolWeight);
    }

    // ************************************** QUERY FUNCTION **************************************

    /**
     * @notice 获取池子数量
     * @return 当前质押池的总数量
     */
    function poolLength() external view returns(uint256) {
        return pool.length;
    }

    /**
     * @notice 计算指定区块范围内的奖励乘数（总奖励代币数）
     * @dev 区块范围为左闭右开区间[_from, _to)，自动限制在[startBlock, endBlock]范围内
     * @param _from 起始区块号（包含）
     * @param _to 结束区块号（不包含）
     * @return multiplier 该区块范围内产生的总奖励数量
     */
    function getMultiplier(uint256 _from, uint256 _to) public view returns(uint256 multiplier) {
        require(_from <= _to, "invalid block");
        if (_from < startBlock) {_from = startBlock;}
        if (_to > endBlock) {_to = endBlock;}
        require(_from <= _to, "end block must be greater than start block");
        bool success;
        (success, multiplier) = (_to - _from).tryMul(MetaNodePerBlock);
        require(success, "multiplier overflow");
    }

    /**
     * @notice 获取用户在指定池子中的待领取奖励数量（当前区块）
     * @param _pid 池子ID
     * @param _user 用户地址
     * @return 用户当前待领取的MetaNode奖励数量
     */
    function pendingMetaNode(uint256 _pid, address _user) external checkPid(_pid) view returns(uint256) {
        return pendingMetaNodeByBlockNumber(_pid, _user, block.number);
    }

    /**
     * @notice 获取用户在指定池子和区块高度的待领取奖励数量
     * @dev 用于模拟计算未来某个区块的奖励数量
     * @param _pid 池子ID
     * @param _user 用户地址
     * @param _blockNumber 目标区块号
     * @return 用户在目标区块高度的待领取奖励数量
     */
    function pendingMetaNodeByBlockNumber(uint256 _pid, address _user, uint256 _blockNumber) public checkPid(_pid) view returns(uint256) {
        Pool storage pool_ = pool[_pid];
        User storage user_ = user[_pid][_user];
        uint256 accMetaNodePerST = pool_.accMetaNodePerST;
        uint256 stSupply = pool_.stTokenAmount;

        if (_blockNumber > pool_.lastRewardBlock && stSupply != 0) {
            uint256 multiplier = getMultiplier(pool_.lastRewardBlock, _blockNumber);
            uint256 MetaNodeForPool = multiplier * pool_.poolWeight / totalPoolWeight;
            accMetaNodePerST = accMetaNodePerST + MetaNodeForPool * (1 ether) / stSupply;
        }

        return user_.stAmount * accMetaNodePerST / (1 ether) - user_.finishedMetaNode + user_.pendingMetaNode;
    }

    /**
     * @notice 获取用户在指定池子中的质押余额
     * @param _pid 池子ID
     * @param _user 用户地址
     * @return 用户当前的质押代币数量
     */
    function stakingBalance(uint256 _pid, address _user) external checkPid(_pid) view returns(uint256) {
        return user[_pid][_user].stAmount;
    }

    /**
     * @notice 获取用户的取消质押信息
     * @param _pid 池子ID
     * @param _user 用户地址
     * @return requestAmount 总的取消质押请求数量（包括已锁定和可提取）
     * @return pendingWithdrawAmount 可以立即提取的已解锁数量
     */
    function withdrawAmount(uint256 _pid, address _user) public checkPid(_pid) view returns(uint256 requestAmount, uint256 pendingWithdrawAmount) {
        User storage user_ = user[_pid][_user];

        for (uint256 i = 0; i < user_.requests.length; i++) {
            if (user_.requests[i].unlockBlocks <= block.number) {
                pendingWithdrawAmount = pendingWithdrawAmount + user_.requests[i].amount;
            }
            requestAmount = requestAmount + user_.requests[i].amount;
        }
    }

    // ************************************** PUBLIC FUNCTION **************************************

    /**
     * @notice 更新指定池子的奖励变量至最新状态
     * @dev 计算从上次更新到当前区块的奖励，并更新累积每份奖励值
     * @param _pid 池子ID
     */
    function updatePool(uint256 _pid) public checkPid(_pid) {
        Pool storage pool_ = pool[_pid];

        if (block.number <= pool_.lastRewardBlock) {
            return;
        }

        (bool success1, uint256 totalMetaNode) = getMultiplier(pool_.lastRewardBlock, block.number).tryMul(pool_.poolWeight);
        require(success1, "overflow");

        (success1, totalMetaNode) = totalMetaNode.tryDiv(totalPoolWeight);
        require(success1, "overflow");

        uint256 stSupply = pool_.stTokenAmount;
        if (stSupply > 0) {
            (bool success2, uint256 totalMetaNode_) = totalMetaNode.tryMul(1 ether);
            require(success2, "overflow");

            (success2, totalMetaNode_) = totalMetaNode_.tryDiv(stSupply);
            require(success2, "overflow");

            (bool success3, uint256 accMetaNodePerST) = pool_.accMetaNodePerST.tryAdd(totalMetaNode_);
            require(success3, "overflow");
            pool_.accMetaNodePerST = accMetaNodePerST;
        }

        pool_.lastRewardBlock = block.number;

        emit UpdatePool(_pid, pool_.lastRewardBlock, totalMetaNode);
    }

    /**
     * @notice 批量更新所有池子的奖励变量
     * @dev 警告：池子较多时会消耗大量gas，谨慎调用
     */
    function massUpdatePools() public {
        uint256 length = pool.length;
        for (uint256 pid = 0; pid < length; pid++) {
            updatePool(pid);
        }
    }

    /**
     * @notice 质押ETH以获得MetaNode奖励
     * @dev 只能用于ETH池（pool ID 0），自动使用msg.value作为质押数量
     */
    function depositETH() public whenNotPaused() payable {
        Pool storage pool_ = pool[ETH_PID];
        require(pool_.stTokenAddress == address(0x0), "invalid staking token address");

        uint256 _amount = msg.value;
        require(_amount >= pool_.minDepositAmount, "deposit amount is too small");

        _deposit(ETH_PID, _amount);
    }

    /**
     * @notice 质押ERC20代币以获得MetaNode奖励
     * @dev 质押前用户需要先授权本合约可以转移其代币
     * @param _pid 要存入的池子ID（不能为0，ETH请使用depositETH）
     * @param _amount 要质押的代币数量
     */
    function deposit(uint256 _pid, uint256 _amount) public whenNotPaused() checkPid(_pid) {
        require(_pid != 0, "deposit not support ETH staking");
        Pool storage pool_ = pool[_pid];
        require(_amount >= pool_.minDepositAmount, "deposit amount is too small");

        if(_amount > 0) {
            IERC20(pool_.stTokenAddress).safeTransferFrom(msg.sender, address(this), _amount);
        }

        _deposit(_pid, _amount);
    }

    /**
     * @notice 发起取消质押请求（第一步）
     * @dev 代币会进入锁定期，到期后可通过withdraw函数提取
     *      取消质押时会自动累积待领取的奖励
     * @param _pid 要取消质押的池子ID
     * @param _amount 要取消质押的代币数量
     */
    function unstake(uint256 _pid, uint256 _amount) public whenNotPaused() checkPid(_pid) whenNotWithdrawPaused() {
        Pool storage pool_ = pool[_pid];
        User storage user_ = user[_pid][msg.sender];

        require(user_.stAmount >= _amount, "Not enough staking token balance");

        updatePool(_pid);

        uint256 pendingMetaNode_ = user_.stAmount * pool_.accMetaNodePerST / (1 ether) - user_.finishedMetaNode;

        if(pendingMetaNode_ > 0) {
            user_.pendingMetaNode = user_.pendingMetaNode + pendingMetaNode_;
        }

        if(_amount > 0) {
            user_.stAmount = user_.stAmount - _amount;
            user_.requests.push(UnstakeRequest({
                amount: _amount,
                unlockBlocks: block.number + pool_.unstakeLockedBlocks
            }));
        }

        pool_.stTokenAmount = pool_.stTokenAmount - _amount;
        user_.finishedMetaNode = user_.stAmount * pool_.accMetaNodePerST / (1 ether);

        emit RequestUnstake(msg.sender, _pid, _amount);
    }

    /**
     * @notice 提取已解锁的质押代币（第二步）
     * @dev 只能提取已过锁定期的代币，自动处理所有符合条件的解锁请求
     * @param _pid 要提取的池子ID
     */
    function withdraw(uint256 _pid) public whenNotPaused() checkPid(_pid) whenNotWithdrawPaused() {
        Pool storage pool_ = pool[_pid];
        User storage user_ = user[_pid][msg.sender];

        uint256 pendingWithdraw_;
        uint256 popNum_;
        for (uint256 i = 0; i < user_.requests.length; i++) {
            if (user_.requests[i].unlockBlocks > block.number) {
                break;
            }
            pendingWithdraw_ = pendingWithdraw_ + user_.requests[i].amount;
            popNum_++;
        }

        for (uint256 i = 0; i < user_.requests.length - popNum_; i++) {
            user_.requests[i] = user_.requests[i + popNum_];
        }

        for (uint256 i = 0; i < popNum_; i++) {
            user_.requests.pop();
        }

        if (pendingWithdraw_ > 0) {
            if (pool_.stTokenAddress == address(0x0)) {
                _safeETHTransfer(msg.sender, pendingWithdraw_);
            } else {
                IERC20(pool_.stTokenAddress).safeTransfer(msg.sender, pendingWithdraw_);
            }
        }

        emit Withdraw(msg.sender, _pid, pendingWithdraw_, block.number);
    }

    /**
     * @notice 领取MetaNode奖励代币
     * @dev 领取所有累积的待领取奖励（包括质押期间和取消质押时累积的）
     * @param _pid 要领取奖励的池子ID
     */
    function claim(uint256 _pid) public whenNotPaused() checkPid(_pid) whenNotClaimPaused() {
        Pool storage pool_ = pool[_pid];
        User storage user_ = user[_pid][msg.sender];

        updatePool(_pid);

        uint256 pendingMetaNode_ = user_.stAmount * pool_.accMetaNodePerST / (1 ether) - user_.finishedMetaNode + user_.pendingMetaNode;

        if(pendingMetaNode_ > 0) {
            user_.pendingMetaNode = 0;
            _safeMetaNodeTransfer(msg.sender, pendingMetaNode_);
        }

        user_.finishedMetaNode = user_.stAmount * pool_.accMetaNodePerST / (1 ether);

        emit Claim(msg.sender, _pid, pendingMetaNode_);
    }

    // ************************************** INTERNAL FUNCTION **************************************

    /**
     * @notice 内部质押函数，处理质押逻辑
     * @dev 由depositETH和deposit函数调用
     *      更新池子奖励后，计算并累积用户待领取奖励，然后更新用户和池子的质押数量
     * @param _pid 池子ID
     * @param _amount 质押数量
     */
    function _deposit(uint256 _pid, uint256 _amount) internal {
        Pool storage pool_ = pool[_pid];
        User storage user_ = user[_pid][msg.sender];

        updatePool(_pid);

        if (user_.stAmount > 0) {
            // 计算用户当前应得的奖励：用户质押量 * 累积每份奖励 / 精度
            // uint256 accST = user_.stAmount.mulDiv(pool_.accMetaNodePerST, 1 ether);
            (bool success1, uint256 accST) = user_.stAmount.tryMul(pool_.accMetaNodePerST);
            require(success1, "user stAmount mul accMetaNodePerST overflow");
            (success1, accST) = accST.tryDiv(1 ether);
            require(success1, "accST div 1 ether overflow");
            
            // 减去已结算的奖励，得到新增奖励
            (bool success2, uint256 pendingMetaNode_) = accST.trySub(user_.finishedMetaNode);
            require(success2, "accST sub finishedMetaNode overflow");

            if(pendingMetaNode_ > 0) {
                (bool success3, uint256 _pendingMetaNode) = user_.pendingMetaNode.tryAdd(pendingMetaNode_);
                require(success3, "user pendingMetaNode overflow");
                user_.pendingMetaNode = _pendingMetaNode;
            }
        }

        if(_amount > 0) {
            (bool success4, uint256 stAmount) = user_.stAmount.tryAdd(_amount);
            require(success4, "user stAmount overflow");
            user_.stAmount = stAmount;
        }

        (bool success5, uint256 stTokenAmount) = pool_.stTokenAmount.tryAdd(_amount);
        require(success5, "pool stTokenAmount overflow");
        pool_.stTokenAmount = stTokenAmount;

        // 更新用户已结算奖励 = 用户新的质押量 * 累积每份奖励 / 精度
        // user_.finishedMetaNode = user_.stAmount.mulDiv(pool_.accMetaNodePerST, 1 ether);
        (bool success6, uint256 finishedMetaNode) = user_.stAmount.tryMul(pool_.accMetaNodePerST);
        require(success6, "user stAmount mul accMetaNodePerST overflow");

        (success6, finishedMetaNode) = finishedMetaNode.tryDiv(1 ether);
        require(success6, "finishedMetaNode div 1 ether overflow");

        user_.finishedMetaNode = finishedMetaNode;

        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @notice 安全的MetaNode代币转账函数
     * @dev 防止因舍入误差导致合约余额不足，不足时转移全部余额
     * @param _to 接收地址
     * @param _amount 转账数量
     */
    function _safeMetaNodeTransfer(address _to, uint256 _amount) internal {
        uint256 MetaNodeBal = MetaNode.balanceOf(address(this));

        if (_amount > MetaNodeBal) {
            MetaNode.transfer(_to, MetaNodeBal);
        } else {
            MetaNode.transfer(_to, _amount);
        }
    }

    /**
     * @notice 安全的ETH转账函数
     * @dev 使用低级call进行转账，并检查返回值
     * @param _to 接收地址
     * @param _amount 转账数量（wei）
     */
    function _safeETHTransfer(address _to, uint256 _amount) internal {
        (bool success, bytes memory data) = address(_to).call{
            value: _amount
        }("");

        require(success, "ETH transfer call failed");
        if (data.length > 0) {
            require(
                abi.decode(data, (bool)),
                "ETH transfer operation did not succeed"
            );
        }
    }
}