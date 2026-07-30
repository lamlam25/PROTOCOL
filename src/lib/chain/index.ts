import "server-only";
import { createMockChainAdapter } from "./mock-adapter";
import { createPolygonChainAdapter } from "./polygon-adapter";
import type { AnchorAdapter } from "./types";

export type { AnchorAdapter, AnchorResult } from "./types";

/**
 * CHAIN_PROVIDER=mock|polygon (default mock). Flipping to `polygon` once
 * POLYGON_AMOY_RPC_URL / CHAIN_DEPLOYER_PRIVATE_KEY / the deployed contract
 * address are set is the only change needed — see Phase 9 / CLAUDE.md.
 */
export function getChainAdapter(): AnchorAdapter {
  const provider = process.env.CHAIN_PROVIDER ?? "mock";

  switch (provider) {
    case "mock":
      return createMockChainAdapter();
    case "polygon":
      return createPolygonChainAdapter();
    default:
      throw new Error(
        `Unknown CHAIN_PROVIDER "${provider}" (real providers land in Phase 9)`
      );
  }
}
