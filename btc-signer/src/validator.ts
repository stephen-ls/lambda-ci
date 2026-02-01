import { PayBatchParams, PayBatchRecipient, UTXO } from 'src/types/pay-batch-params.type';
import { IsPositiveOptions, ValidationResult } from 'src/types/validation';
import { PaymentError } from 'src/errors/payment.error';

const MIN_PAYMENT_SAT = 546;

export const isCondition = (
  condition: boolean,
  errorString: string,
): ValidationResult => condition ? null : [errorString];

export const isObject = (key: string, value: unknown): ValidationResult =>
  isCondition(
    typeof value === 'object' && value !== null && !Array.isArray(value),
    `${key} must be an object`
  )

export const isNonEmptyString = (key: string, value: unknown): ValidationResult =>
  isCondition(
    typeof value === 'string' && value.trim().length > 0,
    `${key} must be an non-empty string`,
  );

export const isInteger = (key: string, value: unknown): ValidationResult =>
  isCondition(
    typeof value === 'number' && Number.isInteger(value),
    `${key} must be an integer`,
  );

export const isPositive = (
  key: string,
  value: unknown,
  options: IsPositiveOptions = {}
): ValidationResult =>
  isCondition(
    typeof value === 'number' && (options.includeZero ? value >= 0 : value > 0),
    `${key} must be a number ${options.includeZero ? '>=' : '>'} 0`,
  );

export const isNonEmptyRecordArray = <T>(
  key: string,
  items: unknown,
  validationFn?: (item: T) => ValidationResult
): ValidationResult => {
  if (!Array.isArray(items) || items.length === 0) {
    return [`${key} must be a non-empty array`];
  } else if (validationFn) {
    for (const item of items) {
      const itemErrors = validationFn(item);
      if (itemErrors) return itemErrors;
    }
  }
  
  return null;
}

export function validateRecommendedFees(feeEstimates: unknown): ValidationResult {
  let errors: ValidationResult = isObject('recommendedFees', feeEstimates);
  
  return errors || ['fastestFee', 'halfHourFee', 'hourFee', 'minimumFee'].reduce<ValidationResult>((acc, key): ValidationResult => {
    const currentErrors = isPositive(key, feeEstimates[key]);
    return currentErrors ? (acc || []).concat(currentErrors) : acc;
  }, null);
}

export function validateUTXO(utxo: unknown): ValidationResult {
  let errors: ValidationResult = isObject('utxo', utxo);
  if (errors) return errors;
  
  const utxoObject = utxo as Partial<UTXO>
  errors = ['vout', 'value', 'confirmations'].reduce<ValidationResult>((acc, key) => {
    const currentErrors = isInteger(key, utxoObject[key]);
    return currentErrors ? (acc || []).concat(currentErrors) : acc;
  }, null)
  
  errors = (errors || []).concat([
    isPositive('value', utxoObject.value),
    isPositive('vout', utxoObject.vout, { includeZero: true }),
    isPositive('confirmations', utxoObject.confirmations, { includeZero: true }),
    isNonEmptyString('txid', utxoObject.txid),
  ].filter(Boolean).flat());
  
  return errors.length ? errors : null;
}

export function validateRecipient(recipient: unknown): ValidationResult {
  let errors: ValidationResult = isObject('recipient', recipient);
  if (errors) return errors;
  
  const recipientObject = recipient as Partial<PayBatchRecipient>
  errors = [
    isNonEmptyString('address', recipientObject.address),
    isInteger('amount', recipientObject.amount),
    isPositive('amount', recipientObject.amount)
  ].filter(Boolean).flat();
  
  if (recipientObject.amount < MIN_PAYMENT_SAT) {
    errors.push('amount is below the minimum payment threshold');
  }
  
  return errors.length ? errors : null;
}

export function validatePayBatchParams(data: unknown): ValidationResult {
  let errors: ValidationResult = isObject('data', data);
  if (errors) return errors;
  
  const dataObject = data as PayBatchParams;
  errors = [
    isNonEmptyRecordArray<PayBatchRecipient>('recipients', dataObject.recipients, validateRecipient),
    isNonEmptyRecordArray<UTXO>('utxos', dataObject.utxos, validateUTXO),
    validateRecommendedFees(dataObject.recommendedFees)
  ].filter(Boolean).flat();
  
  return errors.length ? errors : null;
}