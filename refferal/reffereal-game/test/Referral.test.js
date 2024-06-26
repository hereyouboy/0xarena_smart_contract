const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const {expect} = require("chai");
const { deployContract } = require("ethereum-waffle");
const BasicToken = require('./BasicToken.json');
const { ethers, upgrades, get, network  } = require("hardhat");
const { BigNumber, Wallet, utils } = require("ethers");
const {parseUnits} = require("ethers/lib/utils");
describe('Referral', function() {
        async function deployFixture() {
        let initalAmount = parseUnits('10000000', 6);
        const [deployer,player0, player1, player2, player3, player4, player5, gameVault, unbalancedGameVault, devVault, vipVault] = await ethers.getSigners();
        const tetherContract = await deployContract(deployer, BasicToken, [initalAmount]);
        const instance = await ethers.getContractFactory("referral");
        const registryAmount = parseUnits('200', 6)
            const referralContract = await upgrades.deployProxy(instance, [tetherContract.address,deployer.address, player0.address, gameVault.address, unbalancedGameVault.address,devVault.address, vipVault.address ], { kind: 'uups' });
        await referralContract.deployed();
        await tetherContract.transfer(player0.address, registryAmount.toBigInt())
        await tetherContract.transfer(player1.address, registryAmount.toBigInt())
        await tetherContract.transfer(player2.address, registryAmount.toBigInt())
        await tetherContract.transfer(player3.address, registryAmount.toBigInt())
        await tetherContract.transfer(player4.address, registryAmount.toBigInt())
        await tetherContract.transfer(player5.address, registryAmount.toBigInt())
        const zeroAddress ='0x0000000000000000000000000000000000000000'
        const maxValueOfPoint = parseUnits('52', 6)
        return { referralContract, tetherContract, deployer, player0, player1, player2, player3, player4, player5, zeroAddress, registryAmount, maxValueOfPoint};
    }
    describe('register actions', function() {
        it("Should revert when registering with a non-existent referrer", async function(){
            const {referralContract, player0, player1} = await loadFixture(deployFixture);
            await expect(referralContract.connect(player0).register(player1.address)).to.be.revertedWith("Referrer does not exist")
        })
        it("Should revert when referrer has two childs", async function(){
            const {referralContract, deployer, player0, player1, player2, player3,tetherContract, registryAmount} = await loadFixture(deployFixture)
            await tetherContract.connect(player1).approve(referralContract.address, registryAmount)
            await expect(referralContract.connect(player1).register(player0.address)).to.emit(referralContract, "Register").withArgs(player1.address);
             await tetherContract.connect(player2).approve(referralContract.address, registryAmount)
             await expect(referralContract.connect(player2).register(player0.address)).to.emit(referralContract, 'Register').withArgs(player2.address);
            await tetherContract.connect(player3).approve(referralContract.address, registryAmount)
             await expect(referralContract.connect(player3).register(player0.address)).to.be.revertedWith("Referrer can not refer new child")
        })
        it("Should revert when registering with insufficient token allowance", async function () {
            const {referralContract, player0, player1} = await loadFixture(deployFixture);
            await expect(referralContract.connect(player1).register(player0.address)).to.be.revertedWith("ERC20: insufficient allowance");
        })
        it("Should allow new players to register Continuously", async function(){
            const {referralContract, player0, player1, player2, player3, player4,tetherContract, registryAmount} = await loadFixture(deployFixture);

            await tetherContract.connect(player1).approve(referralContract.address, registryAmount)
            await expect(referralContract.connect(player1).register(player0.address)).to.emit(referralContract, 'Register').withArgs(player1.address);
            await tetherContract.connect(player2).approve(referralContract.address, registryAmount)
            await expect(referralContract.connect(player2).register(player0.address)).to.emit(referralContract, 'Register').withArgs(player2.address);
            await tetherContract.connect(player3).approve(referralContract.address, registryAmount)
            await expect(referralContract.connect(player3).register(player1.address)).to.emit(referralContract, 'Register').withArgs(player3.address);
            await tetherContract.connect(player4).approve(referralContract.address, registryAmount)
            await expect(referralContract.connect(player4).register(player2.address)).to.emit(referralContract, 'Register').withArgs(player4.address);
        })
    })


    describe('reward calculation and withdraw', async function(){

        it("Should calculate reward with max value of point limit", async function(){
            const {referralContract, deployer, player0, player1, player2, player3, player4, tetherContract, registryAmount, maxValueOfPoint} = await loadFixture(deployFixture);
            await tetherContract.connect(player1).approve(referralContract.address, registryAmount)
            await expect(referralContract.connect(player1).register(player0.address)).to.emit(referralContract, 'Register').withArgs(player1.address);
            await tetherContract.connect(player2).approve(referralContract.address, registryAmount)
            await expect(referralContract.connect(player2).register(player0.address)).to.emit(referralContract, 'Register').withArgs(player2.address);
            await tetherContract.connect(player3).approve(referralContract.address, registryAmount)
            await expect(referralContract.connect(player3).register(player1.address)).to.emit(referralContract, 'Register').withArgs(player3.address);
            await tetherContract.connect(player4).approve(referralContract.address, registryAmount)
            await expect(referralContract.connect(player4).register(player2.address)).to.emit(referralContract, 'Register').withArgs(player4.address);
            const KEEPER_ROLE = ethers.utils.formatBytes32String('KEEPER_ROLE');
            await referralContract.connect(deployer).grantRole(KEEPER_ROLE, deployer.address)
            expect(await referralContract.hasRole(KEEPER_ROLE, deployer.address)).to.equal(true)
            await referralContract.connect(deployer).rewardCalculation();

            let deployerNode= await referralContract.connect(deployer). getPlayerNodeAdmin(deployer.address)
            expect(maxValueOfPoint.mul(deployerNode.point)).be.equal(deployerNode.balance)
        })
        it("Should implement tree with lots of nodes", async function(){
            const {referralContract, deployer, player0,registryAmount, tetherContract} = await loadFixture(deployFixture)
            let referrer = player0;
            let player1, player2;
            const provider = ethers.provider;
            const etherAmount = ethers.utils.parseEther('0.2')
            let beforeRegisterBalance;
            let afterRegisterBalance;
            const max =5
                //[player0, player1] =await ethers.getSigners()
            for(i=0; i < max; i++){
                player1 = await ethers.getImpersonatedSigner(ethers.Wallet.createRandom().address)
                player2 = await ethers.getImpersonatedSigner(ethers.Wallet.createRandom().address)
                await tetherContract.connect(deployer).transfer(player1.address, registryAmount.toBigInt())
                await tetherContract.connect(deployer).transfer(player2.address, registryAmount.toBigInt())
                const tx0 = {
                    to: player1.address,
                    value: etherAmount
                }
                await deployer.sendTransaction(tx0)
                const tx1 = {
                    to: player2.address,
                    value: etherAmount
                }
                await player0.sendTransaction(tx1)
                await tetherContract.connect(player1).approve(referralContract.address, registryAmount)
                await referralContract.connect(player1).register(referrer.address);

                await tetherContract.connect(player2).approve(referralContract.address, registryAmount)
                await referralContract.connect(player2).register(referrer.address);
                referrer = player1;
            }
            const KEEPER_ROLE = ethers.utils.formatBytes32String('KEEPER_ROLE');
            await referralContract.connect(deployer).grantRole(KEEPER_ROLE, deployer.address)
            await referralContract.connect(deployer).rewardCalculation();
            const totalDeposit = registryAmount.mul(max * 2).mul(7).div(10)
            const contractBalance = await tetherContract.balanceOf(referralContract.address)
            let valueOfPoint = totalDeposit.div(max * 2)
            const maxValueOfPoint = parseUnits('60', 6)
            if(valueOfPoint > maxValueOfPoint) valueOfPoint = maxValueOfPoint
            const node = await referralContract. getPlayerNodeAdmin(deployer.address)
            //console.log(node)
            expect(node.balance).be.equal(valueOfPoint.mul(node.point))

        })

        it("Should calculate rewards including surplusDeposit", async function() {
            const { referralContract, deployer, player0, player1, player2, player3, tetherContract, registryAmount } = await loadFixture(deployFixture);

            //const surplusDeposit = parseUnits('1000', 6); // Example surplusDeposit amount
            const maxSurplusDeposit = parseUnits('25000', 6)
            // Set surplusDeposit in the contract (assuming you have a function for this)
            //await referralContract.connect(deployer).setSurplusDeposit(surplusDeposit);
            await referralContract.connect(deployer).setMaxSurplusDeposit(maxSurplusDeposit)
            const etherAmount = ethers.utils.parseEther('0.2')
            // Players register from right branch, seven child in a row
            //
            let playerLeft
            let referrer = player0
            for(i=0; i<4; i++){

                playerLeft = await ethers.getImpersonatedSigner(ethers.Wallet.createRandom().address)
                await tetherContract.connect(deployer).transfer(playerLeft.address, registryAmount.toBigInt())
                const tx0 = {
                    to: playerLeft.address,
                    value: etherAmount
                }
                await deployer.sendTransaction(tx0)
                await tetherContract.connect(playerLeft).approve(referralContract.address, registryAmount)
                await referralContract.connect(playerLeft).register(referrer.address);
                referrer = playerLeft;

            }
            let playerRight
            referrer = player0
            for(i=0; i <7 ; i++){
                playerRight = await ethers.getImpersonatedSigner(ethers.Wallet.createRandom().address)
                await tetherContract.connect(deployer).transfer(playerRight.address, registryAmount.toBigInt())
                const tx0 = {
                    to: playerRight.address,
                    value: etherAmount
                }
                await deployer.sendTransaction(tx0)
                await tetherContract.connect(playerRight).approve(referralContract.address, registryAmount)
                await referralContract.connect(playerRight).register(referrer.address);
                referrer = playerRight;
            }

            // Deployer calculates rewards
            const KEEPER_ROLE = ethers.utils.formatBytes32String('KEEPER_ROLE');
            await referralContract.connect(deployer).grantRole(KEEPER_ROLE, deployer.address);
            expect(await referralContract.hasRole(KEEPER_ROLE, deployer.address)).to.equal(true);
            let surplusAmount = await referralContract.connect(deployer).getSurplusDeposit();

            await referralContract.connect(deployer).rewardCalculation();
            surplusAmount = await referralContract.connect(deployer).getSurplusDeposit();
            console.log(surplusAmount)
            let player0Node = await referralContract.getPlayerNodeAdmin(player0.address);
            console.log(player0Node.balance)
            //adding first node
            playerLeftAddress = player0Node.leftChild;
            console.log(player0Node.balance)
            await tetherContract.connect(player1).approve(referralContract.address, registryAmount)
            await referralContract.connect(player1).register(playerLeftAddress)
            await referralContract.connect(deployer).rewardCalculation();
            surplusAmount = await referralContract.connect(deployer).getSurplusDeposit();
            console.log(surplusAmount)

            await tetherContract.connect(player2).approve(referralContract.address, registryAmount)
            await referralContract.connect(player2).register(player1.address)
            await referralContract.connect(deployer).rewardCalculation();
            surplusAmount = await referralContract.connect(deployer).getSurplusDeposit();
            console.log(surplusAmount)
            player0Node = await referralContract.getPlayerNodeAdmin(player0.address);
            //adding second node
            await expect(referralContract.connect(deployer).rewardCalculation()).to.be.revertedWith("There is no points today");
            await tetherContract.connect(player3).approve(referralContract.address, registryAmount)
            await referralContract.connect(player3).register(player1.address)
            await referralContract.connect(deployer).rewardCalculation()
            surplusAmount = await referralContract.connect(deployer).getSurplusDeposit();
            console.log(surplusAmount)
            player0Node = await referralContract.getPlayerNodeAdmin(player0.address);
            console.log(player0Node.point)
            // Assuming each player's balance should reflect the effect of the surplusDeposit
        });

    })
})
