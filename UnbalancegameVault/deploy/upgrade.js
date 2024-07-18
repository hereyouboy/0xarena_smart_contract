
const {ethers, upgrades} = require("hardhat");
async function main(){
  const currentAddress = "0x10E7F9feB9096DCBb94d59D6874b07657c965981";
  const GameVault= await ethers.getContractFactory("GameVault");
  const gameVaultV2 = await upgrades.upgradeProxy(currentAddress, GameVault);
  console.log("updated")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
