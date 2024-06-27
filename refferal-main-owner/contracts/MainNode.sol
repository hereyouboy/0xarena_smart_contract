//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./IReferral.sol";
contract MainNode is Initializable, UUPSUpgradeable, AccessControlUpgradeable{
    struct Partner{
        address account;
        uint balance;
    }
    Partner[] partnerSet;
    IReferral referral;
    IERC20Upgradeable tether;
    function initialize (address _tether, address _owner) public initializer{_setupRole(DEFAULT_ADMIN_ROLE, _owner);
        tether = IERC20Upgradeable(_tether);
    }

    function rewardReferral () external onlyRole(DEFAULT_ADMIN_ROLE){
        uint balance;
        balance=tether.balanceOf(address(referral));
        require(balance > 0 , "you don't have balance");
        referral.withdraw();
        partnershipBalanceCalculation(balance);
    }

    function claimReward() external onlyRole(DEFAULT_ADMIN_ROLE){
        for(uint32 i = 0; i < partnerSet.length; i++) {
            if(msg.sender == partnerSet[i].account){
                uint amount = partnerSet[i].balance;
                partnerSet[i].balance = 0;
                tether.transfer(msg.sender, amount);
            }
        }
    }

    function partnershipBalanceCalculation (uint _amount) private {
        for(uint32 i=0; i < partnerSet.length; i++){
            partnerSet[i].balance += _amount / partnerSet.length;
        }
    }
    function setReferral(address _referral) external onlyRole(DEFAULT_ADMIN_ROLE){
        referral = IReferral(_referral);
    }
    function setPartner(address _partner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Partner memory newPartner;
        newPartner.account = _partner;
        newPartner.balance = 0 ether;
        partnerSet.push(newPartner);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
