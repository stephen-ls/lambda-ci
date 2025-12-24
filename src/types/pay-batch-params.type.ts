export interface FeeEstimates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  minimumFee: number;
}

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  confirmations: number;
}

export type PayBatchRecipient = {
  address: string;
  amount: number;
};

export type PayBatchParams = {
  recipients: PayBatchRecipient[];
  utxos: UTXO[];
  recommendedFees: FeeEstimates;
};
