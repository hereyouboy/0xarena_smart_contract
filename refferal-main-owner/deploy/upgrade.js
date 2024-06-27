const {ethers, upgrades} = require("hardhat");
async function main(){
  const currentAddress = "0xF2193988CB18b74695ECD43120534705D4b2ec96";
  const MainNode= await ethers.getContractFactory("MainNode");
  const mainNodeV2 = await upgrades.upgradeProxy(currentAddress, MainNode);
  console.log("updated")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
