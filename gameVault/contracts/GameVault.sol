//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
contract GameVault is Initializable, UUPSUpgradeable, AccessControlUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    IERC20Upgradeable tether;
    event ChallengeReward(uint256);
    event ClaimReward(address ,uint256);
    mapping(address => uint256) playersBalance;
    struct PlayerInfo {
        address player;
        uint256 balance;
    }
    function initialize (
        address _tether,
        address _owner
    ) public initializer {
        tether = IERC20Upgradeable(_tether);
        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
    }
    function playersReward(PlayerInfo[] calldata _playerSet) external onlyRole(DEFAULT_ADMIN_ROLE){
        for(uint256 i=0; i< _playerSet.length; i++) {
            playersBalance[_playerSet[i].player] +=  _playerSet[i].balance;
        }
    }
    function claimReward() external {
        require(playersBalance[msg.sender] > 0 , "You don't have any reward");
        require(playersBalance[msg.sender] <= tether.balanceOf(address(this)), "You can't withdraw at this moment");
        uint256 amount = playersBalance[msg.sender];
        playersBalance[msg.sender] = 0;
        tether.transfer(msg.sender, amount);
        emit ClaimReward(msg.sender, amount);
    }
    function claimRewardAdmin(address _player) private {
        require(playersBalance[_player] > 0 , "You don't have any reward");
        require(playersBalance[_player] <= tether.balanceOf(address(this)), "You can't withdraw at this moment");
        uint256 amount = playersBalance[_player];
        playersBalance[_player] = 0;
        tether.transfer(_player, amount);
        emit ClaimReward(_player, amount);
    }
    function claimRewardAdminList(address[] memory _playerSet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for(uint256 i = 0 ; i< _playerSet.length; i++){
           claimRewardAdmin(_playerSet[i]);
        }
    }
    function playerBalance() external view returns(uint)  {
        return playersBalance[msg.sender];
    }
    function playerBalanceAdmin(address _player) external view onlyRole(DEFAULT_ADMIN_ROLE) returns(uint){
        return playersBalance[_player];
    }
    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
