const {ethers, upgrades} = require("hardhat");

async function main() {
    const tether="0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
    const owner = "0xd2244298FC3C32CCbc0D65760D9C5cBA766Ef69c"

    const GameVault= await ethers.getContractFactory("GameVault");

    const gameVault= await upgrades.deployProxy(GameVault, [tether, owner], {kind: 'uups'});

    await gameVault.deployed();
    console.log("GameVault deployed to:", gameVault.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
