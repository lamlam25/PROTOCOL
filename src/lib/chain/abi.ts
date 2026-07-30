export const RECORD_ANCHOR_ABI = [
  {
    type: "function",
    name: "anchorRecord",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sha256Hash", type: "bytes32" },
      { name: "recordType", type: "string" },
      { name: "recordId", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "verifyRecord",
    stateMutability: "view",
    inputs: [{ name: "sha256Hash", type: "bytes32" }],
    outputs: [
      { name: "exists", type: "bool" },
      { name: "recordType", type: "string" },
      { name: "recordId", type: "string" },
      { name: "submitter", type: "address" },
      { name: "timestamp", type: "uint256" },
    ],
  },
] as const;
