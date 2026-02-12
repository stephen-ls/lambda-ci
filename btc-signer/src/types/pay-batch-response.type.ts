export type PayBatchResponse = {
  txHex: string;
  txId: string;
  recipientCount: number;
  fee: number;
  totalAmount: number;
  walletAddress: string;
};
