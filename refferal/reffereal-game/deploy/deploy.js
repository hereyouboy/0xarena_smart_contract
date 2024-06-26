const {ethers, upgrades} = require("hardhat");
async function main() {
    const tether="0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
    const owner = "0xd2244298FC3C32CCbc0D65760D9C5cBA766Ef69c"
    const firstNode = "0xF2193988CB18b74695ECD43120534705D4b2ec96"
    const gameVault ="0x65f83111e525C8a577C90298377e56E72C24aCb2"
    const devVault = "0xC5f4e1A09493a81e646062dBDc3d5B14E769F407"
    const vipVault = "0xab4a164a6C868Fa375e3F7E9B7f468d8B3345d52"
    const unbalancedGameVault = "0x10E7F9feB9096DCBb94d59D6874b07657c965981"
    const Referral= await ethers.getContractFactory("referral");
    const referral= await upgrades.deployProxy(Referral, [tether, owner, firstNode, gameVault, unbalancedGameVault, devVault, vipVault], {kind: 'uups'});
    await referral.waitForDeployment();
    console.log("Referral deployed to:", await referral.getAddress())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
