//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
contract DevVault is Initializable, UUPSUpgradeable, AccessControlUpgradeable{

    IERC20Upgradeable tether;
    function initialize (address _tether, address _owner) public initializer{
        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        tether = IERC20Upgradeable(_tether);
    }
    function withdraw (address _to) external onlyRole(DEFAULT_ADMIN_ROLE){
        uint balance = tether.balanceOf(address(this));
        tether.transfer(_to, balance);
    }
    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
