export type PayBatchResponse = {
  txHex: string;
  recipientCount: number;
  fee: number;
  totalAmount: number;
  walletAddress: string;
};
