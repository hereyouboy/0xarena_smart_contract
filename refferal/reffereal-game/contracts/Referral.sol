//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract referral is Initializable, UUPSUpgradeable, AccessControlUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    uint256 registryAmount;
    IERC20Upgradeable tether;
    uint256 dailyPoints;
    uint256 dailyUnbalancedDeposit;
    uint256 dailyDeposit;
    uint128 dailyUnbalancedPoints;
    uint256 unbalancedPaymentTreshhold;
    uint256 unbalancedPaymentExpiryDate;
    uint256 maxValueOfPoint;
    uint256 maxDailyPayment;
    uint256 firstFeeRange;
    uint256 secondFeeRange;
    uint32 public constant ratioOfTimeStamp = 60 * 60 * 24;
    uint8 firstFeePercent;
    uint8 secondFeePercent;
    uint8 thirdFeePercent;
    address gameVault;
    address devVault;
    address vipVault;
    address unbalancedGameVault;
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    uint8 referralPercentage;
    uint8 gamePercentage;
    uint8 unbalancedGamePercentage;
    uint8 vipPercentage;
    uint8 devPercentage;
    event Register(address);
    event DeleteRefer(address, address);

    struct Node {
        uint256 startTime;
        uint256 balance;
        uint24 point;
        uint24 depthLeftBranch;
        uint24 depthRightBranch;
        uint24 depth;
        address player;
        address parent;
        address leftChild;
        address rightChild;
        bool isPointChanged;
        bool unbalancedAllowance;
    }

    struct UnbalancedNode {
        uint256 startTime;
        uint256 payment;
        uint24 point;
        bool isPointChanged;
    }

    struct ChangedPointPlayer {
        address player;
        uint32 previousPoint; //last balance till previous day
    }

    ChangedPointPlayer[] changedPointPlayerSet;
    ChangedPointPlayer[] changedPointUnbalancedPlayerSet;
    mapping(address => Node) public NodeSet;
    mapping(address => UnbalancedNode) public UnbalancedNodeSet;
    uint surplusDeposit;
    uint maxSurplusDeposit;
    function initialize(
        address _tether,
        address _owner,
        address _firstNode,
        address _gameVault,
        address _unbalancedGameVault,
        address _devVault,
        address _vipVault
    ) public initializer {
        tether = IERC20Upgradeable(_tether);
        gameVault = _gameVault;
        unbalancedGameVault = _unbalancedGameVault;
        devVault = _devVault;
        vipVault = _vipVault;
        registryAmount = 200 * 10 ** 6;
        maxValueOfPoint = 52 * 10 ** 6;
        maxDailyPayment = 2000 * 10 ** 6;
        unbalancedPaymentTreshhold = 400 * 10 ** 6;
        unbalancedPaymentExpiryDate = 120 days;
        firstFeeRange = 500 * 10 ** 6;
        secondFeeRange = 1000 * 10 ** 6;
        firstFeePercent = 1;
        secondFeePercent = 2;
        thirdFeePercent = 3;
        referralPercentage =73;
        vipPercentage = 5;
        gamePercentage = 12;
        unbalancedGamePercentage = 3;
        devPercentage = 7;
        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(KEEPER_ROLE, _owner);
        NodeSet[_firstNode] = Node(
            block.timestamp,
            0,
            0,
            0,
            0,
            1,
            _firstNode,
            address(0),
            address(0),
            address(0),
            false,
            true
        );
        UnbalancedNodeSet[_firstNode] = UnbalancedNode(
            block.timestamp,
            0,
            0,
            false
        );
    }

    function register(address referrer) public {
        require(
            NodeSet[referrer].player != address(0),
            "Referrer does not exist"
        );
        require(
            NodeSet[referrer].leftChild == address(0) || NodeSet[referrer].rightChild == address(0),
            "Referrer can not refer new child"
        );
        require(
            NodeSet[msg.sender].player == address(0), "You have registered before"
        );
        Node memory parentNode = NodeSet[referrer];
        require(
            tether.transferFrom(
                msg.sender,
                address(this),
                (registryAmount * referralPercentage) / 100
            ),
            "Transferring allowance"
        );

        require(
            tether.transferFrom(
                msg.sender,
                vipVault,
                (registryAmount * vipPercentage) / 100
            ),
            "Transferring allowance"
        );

        require(
            tether.transferFrom(
                msg.sender,
                gameVault,
                (registryAmount * gamePercentage) / 100
            ),
            "Transferring allowance"
        );

        require(
            tether.transferFrom(
                msg.sender,
                unbalancedGameVault,
                (registryAmount * unbalancedGamePercentage) / 100
            ),
            "Transferring allowance"
        );

        require(
            tether.transferFrom(
                msg.sender,
                devVault,
                (registryAmount * devPercentage) / 100
            ),
            "Transferring allowance"
        );
        NodeSet[referrer].leftChild == address(0) ? NodeSet[referrer].leftChild = msg.sender : NodeSet[referrer].rightChild = msg.sender;
        dailyDeposit += (registryAmount * referralPercentage) / 100;
        NodeSet[msg.sender] = Node(
            block.timestamp,
            0,
            0,
            0,
            0,
            ++parentNode.depth,
            msg.sender,
            referrer,
            address(0),
            address(0),
            false,
            true
        );
        Node memory currentNode = NodeSet[msg.sender];
        for (uint24 i = 0; i < NodeSet[msg.sender].depth; i++) {
            parentNode = NodeSet[currentNode.parent];
            uint24 currentPoint = parentNode.point;
            if (parentNode.leftChild == currentNode.player) {
                ++parentNode.depthLeftBranch;
            } else if (parentNode.rightChild == currentNode.player) {
                ++parentNode.depthRightBranch;
            }
            parentNode.point = parentNode.depthLeftBranch <=
                parentNode.depthRightBranch
                ? parentNode.depthLeftBranch
                : parentNode.depthRightBranch;
            if (parentNode.point > currentPoint) {
                dailyPoints++;
                if (parentNode.isPointChanged == false) {
                    changedPointPlayerSet.push(
                        ChangedPointPlayer(parentNode.player, currentPoint)
                    );
                    parentNode.isPointChanged = true;
                }
            }

            NodeSet[parentNode.player] = parentNode;
            currentNode = parentNode;
        }
        emit Register(msg.sender);
    }

    function rewardCalculation() external onlyRole(KEEPER_ROLE) {
        require(dailyPoints > 0, "There is no points today");
        require(dailyDeposit > 0, "There is no deposit today");
        surplusDeposit += dailyDeposit;
        if(surplusDeposit > maxSurplusDeposit){
            tether.transfer(devVault, (surplusDeposit - maxSurplusDeposit));
            surplusDeposit = maxSurplusDeposit;
        }

        uint256 valueOfPoint = surplusDeposit / dailyPoints;
        if (valueOfPoint > maxValueOfPoint) valueOfPoint = maxValueOfPoint;
        dailyDeposit = 0;
        dailyPoints = 0;
        for (uint256 i = 0; i < changedPointPlayerSet.length; i++) {
            ChangedPointPlayer
                memory changedPointPlayer = changedPointPlayerSet[i];
            delete changedPointPlayerSet[i];
            uint32 addedPoint = NodeSet[changedPointPlayer.player].point -
                changedPointPlayer.previousPoint;
            NodeSet[changedPointPlayer.player].isPointChanged = false;
            if (addedPoint * valueOfPoint > maxDailyPayment) {
                NodeSet[changedPointPlayer.player].balance += maxDailyPayment;
                surplusDeposit -= maxDailyPayment;
            } else {
                NodeSet[changedPointPlayer.player].balance +=
                    addedPoint *
                    valueOfPoint;
               surplusDeposit -= (addedPoint * valueOfPoint);
            }
        }
    }

    function withdraw() external {
        require(
            NodeSet[msg.sender].player != address(0),
            "You are not registered"
        );
        uint256 amount = NodeSet[msg.sender].balance;
        NodeSet[msg.sender].balance = 0;
        uint256 fee;
        if (amount < firstFeeRange) {
            fee = (amount * firstFeePercent) / 100;
            tether.transfer(devVault, fee);
            tether.transfer(msg.sender, amount - fee);
        }

        if (firstFeeRange <= amount && amount < secondFeeRange) {
            fee = (amount * secondFeePercent) / 100;
            tether.transfer(devVault, fee);
            tether.transfer(msg.sender, amount - fee);
        }

        if (amount >= secondFeeRange) {
            fee = (amount * thirdFeePercent) / 100;
            tether.transfer(devVault, fee);
            tether.transfer(msg.sender, amount - fee);
        }
    }

    function setRegistryAmount(
        uint256 _registryAmount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        registryAmount = _registryAmount;
    }

    function setFirstFeeRange(
        uint256 _firstFeeRange
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        firstFeeRange = _firstFeeRange;
    }

    function setSecondFeeRange(
        uint256 _secondFeeRange
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        secondFeeRange = _secondFeeRange;
    }

    function setFirstFeePercent(
        uint8 _firstFeePercent
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        firstFeePercent = _firstFeePercent;
    }

    function setSecondFeePercent(
        uint8 _secondFeePercent
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        secondFeePercent = _secondFeePercent;
    }

    function setThirdFeePercent(
        uint8 _thirdFeePercent
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        thirdFeePercent = _thirdFeePercent;
    }

    function setMaxValueOfPoint(
        uint256 _maxValueOfPoint
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxValueOfPoint = _maxValueOfPoint;
    }

    function setMaxDailyPayment(
        uint256 _maxDailyPayment
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxDailyPayment = _maxDailyPayment;
    }

    function setVaultPercentages (uint8 _referral, uint8 _game, uint8 _dev, uint8 _vip, uint8 _unbalanced) external onlyRole(DEFAULT_ADMIN_ROLE) {
        referralPercentage = _referral;
        gamePercentage = _game;
        devPercentage = _dev;
        vipPercentage = _vip;
        unbalancedGamePercentage = _unbalanced;
    }


    function getBalanceOfPlayer() external view returns (uint256) {
        return NodeSet[msg.sender].balance;
    }

    function getPlayerNodeAdmin(
        address player
    ) external view onlyRole(DEFAULT_ADMIN_ROLE) returns (Node memory) {
        return NodeSet[player];
    }
    function getPlayerNode() external view returns (Node memory) {
        return NodeSet[msg.sender];
    }


    function setGameVaultAddress(address _gameVault) external onlyRole(DEFAULT_ADMIN_ROLE) {
        gameVault = _gameVault;
    }

    function setSurplusDeposit(uint _surplus) external onlyRole(DEFAULT_ADMIN_ROLE) {
        surplusDeposit = _surplus;
    }
    function getSurplusDeposit() external view onlyRole(DEFAULT_ADMIN_ROLE) returns(uint)  {
        return surplusDeposit;
    }

    function setMaxSurplusDeposit(uint _maxSurplus) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxSurplusDeposit = _maxSurplus;
    }
    function getDailyPoints() external view onlyRole(DEFAULT_ADMIN_ROLE) returns(uint) {
        return dailyPoints;
    }
    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
