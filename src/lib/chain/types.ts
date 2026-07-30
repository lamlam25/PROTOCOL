export interface AnchorResult {
  txHash: string;
  contractAddress: string;
  explorerUrl: string;
  provider: "mock" | "polygon";
}

export interface VerificationResult {
  exists: boolean;
  recordType: string;
  recordId: string;
  submitter: string;
  timestamp: bigint;
  provider: "mock" | "polygon";
}

export interface AnchorAdapter {
  anchor(params: {
    sha256Hex: string;
    recordType: string;
    recordId: string;
  }): Promise<AnchorResult>;
  verify(sha256Hex: string): Promise<VerificationResult>;
  isConfigured(): boolean;
}
