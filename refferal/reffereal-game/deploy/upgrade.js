const {ethers, upgrades} = require("hardhat");
async function main(){
  const currentAddress = "0x3bC03e9793d2E67298fb30871a08050414757Ca7"
  const Referral= await ethers.getContractFactory("referral");
  const referralV2 = await upgrades.upgradeProxy(currentAddress, Referral);
  console.log("updated")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
