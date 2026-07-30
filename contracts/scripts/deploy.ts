import { network } from "hardhat";
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Deploys RecordAnchor and writes the resulting address + ABI to
 * deployments/<network>.json so the Next.js app can pick them up.
 */
async function main() {
  const { ethers, networkName } = await network.getOrCreate();

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`Network:  ${networkName}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(balance)} POL`);

  if (balance === 0n) {
    throw new Error(
      "Deployer wallet has 0 POL. Fund it from the Amoy faucet before deploying — see CLAUDE.md Phase 9."
    );
  }

  const factory = await ethers.getContractFactory("RecordAnchor");
  const contract = await factory.deploy(deployer.address);
  console.log("Deploying...");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  console.log(`\nRecordAnchor deployed at: ${address}`);
  console.log(`Deploy tx: ${deployTx?.hash}`);
  console.log(`Explorer:  https://amoy.polygonscan.com/address/${address}`);

  const artifact = await import(
    "../artifacts/contracts/RecordAnchor.sol/RecordAnchor.json",
    { with: { type: "json" } }
  ).catch(() => null);

  const outDir = join(__dirname, "..", "deployments");
  await mkdir(outDir, { recursive: true });
  await writeFile(
    join(outDir, `${networkName}.json`),
    JSON.stringify(
      {
        network: networkName,
        address,
        deployTxHash: deployTx?.hash ?? null,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        abi: artifact?.default?.abi ?? null,
      },
      null,
      2
    ) + "\n"
  );
  console.log(`\nWrote deployments/${networkName}.json`);
  console.log(
    `\nNext: put this in d:\\july\\.env.local\n  RECORD_ANCHOR_CONTRACT_ADDRESS=${address}\n  CHAIN_PROVIDER=polygon`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
