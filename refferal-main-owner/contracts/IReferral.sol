//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
interface IReferral {
    function getBalanceOfPlayer() external view returns (uint256);
    function withdraw() external;
 }
