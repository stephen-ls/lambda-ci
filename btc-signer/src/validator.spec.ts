import { validatePayBatchParams } from './validator';

describe('Validation', () => {
  const validPayload = {
    recipients: [{ address: 'tb1qt62p6kt0wnakuxrdcnyz4n2fcdwsgnnneg806q', amount: 1000 }],
    utxos: [{ txid: 'txid', vout: 0, value: 1000, confirmations: 1 }],
    recommendedFees: { fastestFee: 10, halfHourFee: 5, hourFee: 3, minimumFee: 1 },
  } as const;
  
  const omit = <T extends Record<string, any>, K extends keyof T>(obj: T, key: K) => {
    const { [key]: _ignored, ...rest } = obj;
    return rest as Omit<T, K>;
  };
  
  const expectInvalid = (data: unknown) => {
    const errors = validatePayBatchParams(data);
    expect(errors).not.toBeNull();
    expect(Array.isArray(errors)).toBe(true);
    expect((errors ?? []).length).toBeGreaterThan(0);
    return errors as string[];
  };
  
  const expectValid = (data: unknown) => {
    expect(validatePayBatchParams(data)).toBeNull();
  };
  
  const expectHasPath = (errors: string[], path: string) => {
    expect(errors.some((e) => e.startsWith(`${path}:`))).toBe(true);
  };
  
  const expectHasSomeMessage = (errors: string[], snippet: string) => {
    expect(errors.some((e) => e.includes(snippet))).toBe(true);
  };
  
  it('accepts valid payload', () => {
    expectValid(validPayload);
  });
  
  describe('root data payload shape', () => {
    it.each([
      { scenario: 'null', data: null },
      { scenario: 'number', data: 1 },
      { scenario: 'array', data: [] },
      { scenario: 'string', data: 'abc' },
    ])('should reject when data is $scenario', ({ data }) => {
      expectInvalid(data);
    });
  });
  
  describe('recipients', () => {
    it.each([
      {
        scenario: 'is missing',
        payload: omit(validPayload, 'recipients'),
      },
      {
        scenario: 'is object',
        payload: { ...validPayload, recipients: {} },
      },
      {
        scenario: 'is primitive',
        payload: { ...validPayload, recipients: 'nope' },
      },
      {
        scenario: 'has no items',
        payload: { ...validPayload, recipients: [] },
      },
    ])('should fail because recipients $scenario', ({ payload }) => {
      const errors = expectInvalid(payload);
      expectHasPath(errors, 'recipients');
    });
    
    it.each([
      {
        scenario: 'recipients has primitive item',
        payload: { ...validPayload, recipients: [1] },
        path: 'recipients[0]'
      },
      {
        scenario: 'recipients has null item',
        payload: { ...validPayload, recipients: [null] },
        path: 'recipients[0]'
      },
      {
        scenario: 'recipients item address is empty string',
        payload: { ...validPayload, recipients: [{ address: '', amount: 1000 }] },
        path: 'recipients[0].address'
      },
      {
        scenario: 'recipients item address is not a string',
        payload: { ...validPayload, recipients: [{ address: 123, amount: 1000 }] },
        path: 'recipients[0].address'
      },
      {
        scenario: 'recipients item amount below MIN_PAYMENT_SAT',
        payload: { ...validPayload, recipients: [{ address: 123, amount: 100 }] },
        path: 'recipients[0].amount'
      },
      {
        scenario: 'recipients item amount is not integer',
        payload: { ...validPayload, recipients: [{ address: 'addr', amount: 1.5 }] },
        path: 'recipients[0].amount'
      },
      {
        scenario: 'recipients item amount is not a number',
        payload: { ...validPayload, recipients: [{ address: 'addr', amount: '1000' }] },
        path: 'recipients[0].amount'
      }
    ])('should fail because $scenario', ({ payload, path }) => {
      const errors = expectInvalid(payload);
      expectHasPath(errors, path);
    });
    
    it('should fail because recipients item has missing fields', () => {
      const errors = expectInvalid({ ...validPayload, recipients: [{}] });
      expect(errors.some((e) => e.startsWith('recipients[0].'))).toBe(true);
    });
  });
  
  describe('utxos', () => {
    it.each([
      {
        scenario: 'is missing',
        payload: omit(validPayload, 'utxos'),
      },
      {
        scenario: 'is object',
        payload: { ...validPayload, utxos: {} },
      },
      {
        scenario: 'is primitive',
        payload: { ...validPayload, utxos: 'nope' },
      },
      {
        scenario: 'has no items',
        payload: { ...validPayload, utxos: [] },
      },
    ])('should fail because utxos $scenario', ({ payload }) => {
      const errors = expectInvalid(payload);
      expectHasPath(errors, 'utxos');
    });
    
    it.each([
      {
        scenario: 'utxos has primitive item',
        payload: { ...validPayload, utxos: [1] },
        path: 'utxos[0]'
      },
      {
        scenario: 'utxos has null item',
        payload: { ...validPayload, utxos: [null] },
        path: 'utxos[0]'
      },
      {
        scenario: 'utxos item txid is empty string',
        payload: { ...validPayload, utxos: [{ txid: '', vout: 0, value: 1000, confirmations: 1 }] },
        path: 'utxos[0].txid'
      },
      {
        scenario: 'utxos item txid is not a string',
        payload: { ...validPayload, utxos: [{ txid: 123, vout: 0, value: 1000, confirmations: 1 }] },
        path: 'utxos[0].txid'
      },
      {
        scenario: 'utxos item vout is negative',
        payload: { ...validPayload, utxos: [{ txid: 'tx', vout: -1, value: 1000, confirmations: 1 }] },
        path: 'utxos[0].vout'
      },
      {
        scenario: 'utxos item vout is not integer',
        payload: { ...validPayload, utxos: [{ txid: 'tx', vout: 0.1, value: 1000, confirmations: 1 }] },
        path: 'utxos[0].vout'
      },
      {
        scenario: 'utxos item confirmations is negative',
        payload: { ...validPayload, utxos: [{ txid: 'tx', vout: 0, value: 1000, confirmations: -1 }] },
        path: 'utxos[0].confirmations'
      },
      {
        scenario: 'utxos item confirmations is not integer',
        payload: { ...validPayload, utxos: [{ txid: 'tx', vout: 0, value: 1000, confirmations: 0.1 }] },
        path: 'utxos[0].confirmations'
      },
      {
        scenario: 'utxos item value is negative or equal to zero',
        payload: { ...validPayload, utxos: [{ txid: 'tx', vout: 0, value: 0, confirmations: 2 }] },
        path: 'utxos[0].value'
      },
      {
        scenario: 'utxos item value is not integer',
        payload: { ...validPayload, utxos: [{ txid: 'tx', vout: 0, value: 1000.5, confirmations: 2 }] },
        path: 'utxos[0].value'
      },
    ])('should fail because $scenario', ({ payload, path }) => {
      const errors = expectInvalid(payload);
      expectHasPath(errors, path);
    });
    
    it('should fail because utxos[0] has missing fields', () => {
      const errors = expectInvalid({ ...validPayload, utxos: [{ txid: 'tx' }] });
      expect(errors.some((e) => e.startsWith('utxos[0].'))).toBe(true);
    });
  });
  
  describe('recommendedFees', () => {
    it.each([
      { scenario: 'missing', payload: omit(validPayload, 'recommendedFees') },
      { scenario: 'primitive', payload: { ...validPayload, recommendedFees: 1 } },
      { scenario: 'null', payload: { ...validPayload, recommendedFees: null } },
    ])('should fail because recommendedFees is $scenario', ({ payload }) => {
      const errors = expectInvalid(payload);
      expectHasPath(errors, 'recommendedFees');
    });
    
    it('should return errors for invalid or missing fee fields', () => {
      const errors = expectInvalid({
        ...validPayload,
        recommendedFees: {
          fastestFee: -1,
          halfHourFee: 0,
        },
      });
      
      expectHasPath(errors, 'recommendedFees.fastestFee');
      expectHasPath(errors, 'recommendedFees.halfHourFee');
      expectHasPath(errors, 'recommendedFees.hourFee');
      expectHasPath(errors, 'recommendedFees.minimumFee');
      expectHasSomeMessage(errors, 'must be > 0');
    });
  });
});
