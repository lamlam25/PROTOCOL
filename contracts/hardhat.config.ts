import { defineConfig, configVariable } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],

  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },

  networks: {
    // Local in-memory chain used by `npm test` — no credentials needed.
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
    // Polygon Amoy testnet. Tokens here have no real-world value.
    amoy: {
      type: "http",
      chainType: "l1",
      chainId: 80002,
      url: configVariable("POLYGON_AMOY_RPC_URL"),
      accounts: [configVariable("CHAIN_DEPLOYER_PRIVATE_KEY")],
    },
  },

  chainDescriptors: {
    80002: {
      name: "Polygon Amoy",
      blockExplorers: {
        etherscan: {
          name: "Polygonscan (Amoy)",
          url: "https://amoy.polygonscan.com",
          apiUrl: "https://api-amoy.polygonscan.com/api",
        },
      },
    },
  },
});
