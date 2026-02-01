export const successfulResponseSchema = {
  type: 'object',
  properties: {
    result: {
      type: 'object',
      properties: {
        txHex: { type: 'string' },
        recipientCount: { type: 'integer' },
        totalAmount: { type: 'integer' },
        fee: { type: 'integer' },
        walletAddress: { type: 'string' }
      },
      required: [
        'txHex',
        'recipientCount',
        'totalAmount',
        'fee',
        'walletAddress'
      ]
    }
  },
  required: ['result']
};

export const errorResponseSchema = {
  type: 'object',
  properties: {
    error: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['error']
}

export const recommendedFees = {
  fastestFee: 10,
  halfHourFee: 5,
  hourFee: 2,
  minimumFee: 1,
};

export const utxos =  [
  {
    txid: 'a'.repeat(64),
    vout: 0,
    value: 50000,
    confirmations: 6,
  },
];

export const addressA = 'tb1qt62p6kt0wnakuxrdcnyz4n2fcdwsgnnneg806q';
export const addressB = 'tb1qc52g3fmlxny95arhex4akgytdrnqzqm4etu4g7';
export const invalidAddress = 'invalid_address';
