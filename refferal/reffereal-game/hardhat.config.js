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
    etherscan:{
        apiKey:{
            arbitrumOne:"XDRBW4M9TWFJI2TP53DDU25TF5HSX3NDI7"
        },
    },
	sourcify:{
        enabled:false
    },
    solidity: {
        version: "0.8.21",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
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
        timeout: 2000000000000000
    } };
