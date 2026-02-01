import {
  isCondition,
  isObject,
  isNonEmptyString,
  isInteger,
  isPositive,
  isNonEmptyRecordArray,
  validateRecommendedFees,
  validateUTXO,
  validateRecipient,
  validatePayBatchParams,
} from './validator';

describe('isCondition', () => {
  it.each([
    {
      scenario: 'returns null when condition is true',
      condition: true,
      error: null,
    },
    {
      scenario: 'returns error array when condition is false',
      condition: false,
      error: ['error'],
    },
  ])('$scenario', ({ condition, error }) => {
    expect(isCondition(condition, 'error')).toEqual(error);
  });
});

describe('isObject', () => {
  it('accepts plain object', () => {
    expect(isObject('data', {})).toBeNull();
  });
  
  it.each([
    { scenario: 'rejects null', data: null },
    { scenario: 'rejects array', data: [] },
    { scenario: 'rejects primitive', data: 1 },
  ])('$scenario', ({ data }) => {
    expect(isObject('data', data)).toEqual(['data must be an object']);
  });
});

describe('isNonEmptyString', () => {
  it('accepts non-empty string', () => {
    expect(isNonEmptyString('key', 'abc')).toBeNull();
  });
  
  it.each([
    { scenario: 'rejects empty string', data: '' },
    { scenario: 'rejects whitespace string', data: '   ' },
    { scenario: 'rejects non-string', data: 1 },
  ])('$scenario', ({ data }) => {
    expect(isNonEmptyString('key', data)).toEqual(['key must be an non-empty string']);
  });
});

describe('isInteger', () => {
  it('accepts integer', () => {
    expect(isInteger('key', 10)).toBeNull();
  });
  
  it.each([
    { scenario: 'rejects float', data: 1.5 },
    { scenario: 'rejects string', data: '1' },
  ])('$scenario', ({ data }) => {
    expect(isInteger('key', data)).toEqual(['key must be an integer']);
  });
});

describe('isPositive', () => {
  it('accepts positive number', () => {
    expect(isPositive('key', 1)).toBeNull();
  });
  
  it('accepts zero when includeZero is true', () => {
    expect(isPositive('key', 0, { includeZero: true })).toBeNull();
  });
  
  it.each([
    { scenario: 'rejects zero by default', data: 0 },
    { scenario: 'rejects negative number', data: -1 },
    { scenario: 'rejects non-number', data: '1' },
  ])('$scenario', ({ data }) => {
    expect(isPositive('key', data)).toEqual(['key must be a number > 0']);
  });
});

describe('isNonEmptyRecordArray', () => {
  it('accepts non-empty array without validator', () => {
    expect(isNonEmptyRecordArray('items', [{}])).toBeNull();
  });
  
  it.each([
    { scenario: 'rejects empty array', data: [] },
    { scenario: 'rejects non-array', data: {} },
  ])('$scenario', ({ data }) => {
    expect(isNonEmptyRecordArray('items', data)).toEqual(['items must be a non-empty array']);
  });
  
  it('fails on first invalid item', () => {
    const validator = jest.fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(['error'])
      .mockReturnValueOnce(['error 2']);
    
    const result = isNonEmptyRecordArray('items', [{}, {}, {}], validator);
    
    expect(result).toEqual(['error']);
    expect(validator).toHaveBeenCalledTimes(2);
  });
});

describe('validateRecommendedFees', () => {
  it('accepts valid fees', () => {
    expect(validateRecommendedFees({
      fastestFee: 10,
      halfHourFee: 5,
      hourFee: 3,
      minimumFee: 1,
    })).toBeNull();
  });
  
  it('rejects non-object', () => {
    expect(validateRecommendedFees(1)).toEqual(['recommendedFees must be an object']);
  });
  
  it('returns errors for invalid and missed fields', () => {
    const result = validateRecommendedFees({
      fastestFee: -1,
      halfHourFee: 0,
    });
    
    expect(result).toContain('fastestFee must be a number > 0');
    expect(result).toContain('halfHourFee must be a number > 0');
    expect(result).toContain('hourFee must be a number > 0');
    expect(result).toContain('minimumFee must be a number > 0');
  });
});

describe('validateUTXO', () => {
  it('accepts valid utxo', () => {
    expect(validateUTXO({
      txid: 'tx',
      vout: 0,
      value: 1000,
      confirmations: 1,
    })).toBeNull();
  });
  
  it('rejects non-object', () => {
    expect(validateUTXO(null)).toEqual(['utxo must be an object']);
  });
  
  it('returns errors for invalid and missed fields', () => {
    const result = validateUTXO({
      txid: '',
      vout: -1,
      confirmations: -1,
    });
    
    expect(result).toContain('txid must be an non-empty string');
    expect(result).toContain('vout must be a number >= 0');
    expect(result).toContain('confirmations must be a number >= 0');
    expect(result).toContain('value must be an integer');
  });
});

describe('validateRecipient', () => {
  it('accepts valid recipient', () => {
    expect(validateRecipient({
      address: 'addr',
      amount: 1000,
    })).toBeNull();
  });
  
  it.each([
    {
      scenario: 'rejects invalid recipient',
      recipient: { address: '', amount: -1 },
      errors: [
        'address must be an non-empty string',
        'amount must be a number > 0',
        'amount is below the minimum payment threshold',
      ]
    },
    {
      scenario: 'rejects recipient with amount less than minimum threshold',
      recipient: { address: 'tb1qt62p6kt0wnakuxrdcnyz4n2fcdwsgnnneg806q', amount: 100 },
      errors: ['amount is below the minimum payment threshold' ]
    },
    {
      scenario: 'rejects empty recipient',
      recipient: {},
      errors: [
        'address must be an non-empty string',
        'amount must be a number > 0',
        'amount must be an integer'
      ]
    }
  ])('$scenario', ({ recipient, errors }) => {
    const result = validateRecipient(recipient);
    errors.forEach(error => expect(result).toContain(error));
  });
});

describe('validatePayBatchParams', () => {
  it('accepts valid payload', () => {
    expect(validatePayBatchParams({
      recipients: [{ address: 'addr', amount: 1000 }],
      utxos: [{ txid: 'tx', vout: 0, value: 1000, confirmations: 1 }],
      recommendedFees: {
        fastestFee: 10,
        halfHourFee: 5,
        hourFee: 3,
        minimumFee: 1,
      },
    })).toBeNull();
  });
  
  it('rejects non-object payload', () => {
    expect(validatePayBatchParams(null)).toEqual(['data must be an object']);
  });
  
  it('propagates nested errors', () => {
    const result = validatePayBatchParams({
      recipients: [],
      utxos: [],
      recommendedFees: {},
    });
    
    expect(result).toContain('recipients must be a non-empty array');
    expect(result).toContain('utxos must be a non-empty array');
  });
});
