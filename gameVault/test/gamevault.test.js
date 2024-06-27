const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { deployContract } = require("ethereum-waffle");
const BasicToken = require('./BasicToken.json');
const { ethers, upgrades } = require("hardhat");
const { BigNumber } = require("ethers");
const {parseUnits} = require("ethers/lib/utils");
describe('GameVault', function() {
        async function deployFixture() {
        let initalAmount = parseUnits('10000000', 6);
        const [deployer,player0, player1, player2, player3, player4, player5] = await ethers.getSigners();
        const tetherContract = await deployContract(deployer, BasicToken, [initalAmount]);
        const instance = await ethers.getContractFactory("GameVault");
        const amount = parseUnits('10000', 6)
        const gameVaultContract = await upgrades.deployProxy(instance, [tetherContract.address, deployer.address], { kind: 'uups' });
        await gameVaultContract.deployed();
        await tetherContract.transfer(gameVaultContract.address, amount.toBigInt())
        const zeroAddress ='0x0000000000000000000000000000000000000000'
        return { gameVaultContract , tetherContract, deployer, player0, player1, player2, player3, player4, player5, zeroAddress};
    }
    describe('deposit reward for players', async function() {
        it("Should claim rewards", async function(){
          const {gameVaultContract, player0, player1, deployer} = await loadFixture(deployFixture);
          const rewards = [
          { player: player0.address, balance: parseUnits('10', 6) },
          { player: player1.address, balance: parseUnits('15', 6)}
          ]

          gameVaultContract.connect(deployer).playersReward(rewards)

          const rewards1 = [
          { player: player0.address, balance: parseUnits('1', 6) },
          { player: player1.address, balance: parseUnits('10', 6)}
          ]
          gameVaultContract.connect(deployer).playersReward(rewards1)
          expect(gameVaultContract.connect(player0).claimReward()).to.emit(gameVaultContract, 'ClaimReward').withArgs(player0.address, parseUnits('11', 6))
          expect(gameVaultContract.connect(player1).claimReward()).to.emit(gameVaultContract, 'ClaimReward').withArgs(player1.address, parseUnits('25', 6))
        })
        // gameVaultContract.connect(deployer).setChallengeReward(parseUnits('1', 6))
        // exp
        // const rewards = [
        //   { player: player0.address, coefficient: 1 },
        //   { player: player1.address, coefficient: 2}
        // ]

    })

})
