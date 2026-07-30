import "server-only";
import { createMockIpfsAdapter } from "./mock-adapter";
import type { IpfsAdapter } from "./types";

export type { IpfsAdapter, IpfsUploadResult } from "./types";

/**
 * STORAGE_PROVIDER=mock|pinata (default mock). Flipping to `pinata` once
 * PINATA_JWT is set is the only change needed — see Phase 9 / CLAUDE.md.
 */
export function getIpfsAdapter(): IpfsAdapter {
  const provider = process.env.STORAGE_PROVIDER ?? "mock";

  switch (provider) {
    case "mock":
      return createMockIpfsAdapter();
    default:
      throw new Error(
        `Unknown STORAGE_PROVIDER "${provider}" (real providers land in Phase 9)`
      );
  }
}
