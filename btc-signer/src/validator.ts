import * as v from 'valibot';

const MIN_PAYMENT_SAT = 546;

const RecommendedFeesSchema = v.object({
  fastestFee: v.pipe(v.number(), v.check((n) => n > 0, 'must be > 0')),
  halfHourFee: v.pipe(v.number(), v.check((n) => n > 0, 'must be > 0')),
  hourFee: v.pipe(v.number(), v.check((n) => n > 0, 'must be > 0')),
  minimumFee: v.pipe(v.number(), v.check((n) => n > 0, 'must be > 0')),
});

const UTXOSchema = v.object({
  txid: v.pipe(v.string(), v.minLength(1)),
  vout: v.pipe(v.number(), v.integer(), v.minValue(0)),
  value: v.pipe(v.number(), v.integer(), v.minValue(1)),
  confirmations: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

const RecipientSchema = v.object({
  address: v.pipe(v.string(), v.minLength(1)),
  amount: v.pipe(v.number(), v.integer(), v.minValue(MIN_PAYMENT_SAT)),
});

const PayBatchParamsSchema = v.object({
  recipients: v.pipe(v.array(RecipientSchema), v.minLength(1)),
  utxos: v.pipe(v.array(UTXOSchema), v.minLength(1)),
  recommendedFees: RecommendedFeesSchema,
});

export function validatePayBatchParams(data: unknown): string[] | null {
  const result = v.safeParse(PayBatchParamsSchema, data);
  
  if (result.success) return null;
  return result.issues.map((issue) => {
    return `${v.getDotPath(issue)}: ${issue.message}`
  });
}
