import "server-only";
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  type Provider,
  toBeHex,
} from "ethers";
import { RECORD_ANCHOR_ABI } from "./abi";
import type { AnchorAdapter, AnchorResult, VerificationResult } from "./types";

const DEFAULT_CHAIN_ID = 80002;
const DEFAULT_EXPLORER_BASE_URL = "https://amoy.polygonscan.com";

type RecordAnchorContract = Contract & {
  anchorRecord(
    sha256Hash: string,
    recordType: string,
    recordId: string
  ): Promise<{ hash: string; wait(): Promise<unknown> }>;
  verifyRecord(
    sha256Hash: string
  ): Promise<[boolean, string, string, string, bigint]>;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set CHAIN_PROVIDER=polygon and provide ${name} in .env.local.`);
  }
  return value;
}

function hashToBytes32(sha256Hex: string) {
  if (!/^[a-f0-9]{64}$/i.test(sha256Hex)) {
    throw new Error(`Invalid SHA-256 hex string: ${sha256Hex}`);
  }
  return toBeHex(BigInt(`0x${sha256Hex}`), 32);
}

function getExplorerBaseUrl() {
  return process.env.NEXT_PUBLIC_CHAIN_EXPLORER_BASE_URL ?? DEFAULT_EXPLORER_BASE_URL;
}

function createContract(provider: Provider) {
  const contractAddress = requireEnv("RECORD_ANCHOR_CONTRACT_ADDRESS");
  const privateKey = requireEnv("CHAIN_DEPLOYER_PRIVATE_KEY");
  const signer = new Wallet(privateKey, provider);
  return {
    contractAddress,
    contract: new Contract(contractAddress, RECORD_ANCHOR_ABI, signer) as RecordAnchorContract,
  };
}

export function createPolygonChainAdapter(): AnchorAdapter {
  return {
    isConfigured() {
      return Boolean(
        process.env.POLYGON_AMOY_RPC_URL &&
          process.env.CHAIN_DEPLOYER_PRIVATE_KEY &&
          process.env.RECORD_ANCHOR_CONTRACT_ADDRESS
      );
    },

    async anchor({ sha256Hex, recordType, recordId }): Promise<AnchorResult> {
      const rpcUrl = requireEnv("POLYGON_AMOY_RPC_URL");
      const provider = new JsonRpcProvider(rpcUrl, DEFAULT_CHAIN_ID);
      const { contract, contractAddress } = createContract(provider);
      const hashBytes32 = hashToBytes32(sha256Hex);

      const tx = await contract.anchorRecord(hashBytes32, recordType, recordId);
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error("Anchor transaction did not return a receipt");
      }

      return {
        txHash: tx.hash,
        contractAddress,
        explorerUrl: `${getExplorerBaseUrl()}/tx/${tx.hash}`,
        provider: "polygon",
      };
    },

    async verify(sha256Hex: string): Promise<VerificationResult> {
      const rpcUrl = requireEnv("POLYGON_AMOY_RPC_URL");
      const provider = new JsonRpcProvider(rpcUrl, DEFAULT_CHAIN_ID);
      const { contract } = createContract(provider);
      const hashBytes32 = hashToBytes32(sha256Hex);

      const [exists, recordType, recordId, submitter, timestamp] =
        await contract.verifyRecord(hashBytes32);

      return {
        exists,
        recordType,
        recordId,
        submitter,
        timestamp,
        provider: "polygon",
      };
    },
  };
}
