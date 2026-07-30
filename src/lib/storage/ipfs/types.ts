export interface IpfsUploadResult {
  cid: string;
  size: number;
  url: string;
  provider: "mock" | "pinata";
}

export interface IpfsAdapter {
  upload(
    file: Blob,
    opts?: { filename?: string }
  ): Promise<IpfsUploadResult>;
  get(cid: string): Promise<Blob>;
  isConfigured(): boolean;
}
