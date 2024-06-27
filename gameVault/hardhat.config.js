/** @type import('hardhat/config').HardhatUserConfig */
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-waffle");
module.exports = {
    defaultNetwork: "arb",
    etherscan: {
        apiKey: {
            bscTestnet: 'ZNU9E474SFWKSKWB4HANAQHJ6HMJ3VKRTX'
        }
    },

    networks: {
        localhost: {
            url: "http://127.0.0.1:8545"
        },
        hardhat: {},

    },
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true
            }
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    mocha: {
        timeout: 20000
    } };
