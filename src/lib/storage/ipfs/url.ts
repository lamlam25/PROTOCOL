/** Client-safe (no "server-only") — resolves a CID to a fetchable URL for display. */
export function getIpfsDisplayUrl(cid: string): string {
  if (cid.startsWith("mock-")) {
    return `/api/dev/local-ipfs/${cid}`;
  }
  const gateway =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL ?? "https://gateway.pinata.cloud/ipfs";
  return `${gateway}/${cid}`;
}
