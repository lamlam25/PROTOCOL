import "server-only";
import { createHash } from "node:crypto";
import type { AnchorAdapter, AnchorResult, VerificationResult } from "./types";

/**
 * Dev-only stand-in for the real Polygon anchor. Deterministic per input
 * (same sha256Hex -> same fake tx hash) so repeated demo runs stay
 * consistent. `explorerUrl` intentionally does not resolve to a real
 * Polygonscan page — the UI must badge this "Mock chain", never present it
 * as a real transaction.
 */
export function createMockChainAdapter(): AnchorAdapter {
  return {
    async anchor({ sha256Hex, recordType, recordId }) {
      const fakeHash = createHash("sha256")
        .update(`${sha256Hex}:${recordType}:${recordId}`)
        .digest("hex");

      return {
        txHash: `0xmock${fakeHash.slice(0, 60)}`,
        contractAddress: "0xmock0000000000000000000000000000000000",
        explorerUrl: "",
        provider: "mock",
      } satisfies AnchorResult;
    },

    async verify() {
      return {
        exists: false,
        recordType: "",
        recordId: "",
        submitter: "0x0000000000000000000000000000000000000000",
        timestamp: BigInt(0),
        provider: "mock",
      } satisfies VerificationResult;
    },

    isConfigured() {
      return true;
    },
  };
}
