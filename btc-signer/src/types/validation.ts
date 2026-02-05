import { PayBatchRecipient, UTXO } from 'src/types/pay-batch-params.type';

export type ValidationResult = string[] | null;

export type IsPositiveOptions = {
  includeZero?: boolean;
}

export type ListItemRecord = Partial<PayBatchRecipient> | Partial<UTXO>;