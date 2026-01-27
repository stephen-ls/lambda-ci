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
    error: { type: 'string' }
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


export const validPaymentCases = [
  {
    recipients: [
      {
        address: addressA,
        amount: 10000,
      },
    ],
    scenario: 'a single recipient',
  },
  {
    recipients: [
      {
        address: addressA,
        amount: 10000,
      },
      {
        address: addressB,
        amount: 20000,
      },
    ],
    scenario: 'multiple recipients'
  },
];


export const invalidPaymentCases = [
  {
    recipients: [
      {
        address: addressA,
        amount: 100000,
      },
    ],
    scenario: 'insufficient funds',
    errorMessage: 'Insufficient funds for batch payment'
  },
  {
    recipients: [{ amount: 10000 }],
    scenario: 'missed address',
    errorMessage: 'Invalid payment parameters'
  },
  {
    recipients: [{ address: addressA }],
    scenario: 'missed amount',
    errorMessage: 'Invalid payment parameters'
  },
  {
    recipients: [
      {
        address: invalidAddress,
        amount: 100000,
      },
    ],
    scenario: 'invalid address',
    errorMessage: 'Invalid Bitcoin address'
  },
  {
    recipients: [
      {
        address: addressA,
        amount: -1000,
      },
    ],
    scenario: 'negative amount',
    errorMessage: 'Amount must be positive'
  },
  {
    recipients: [
      {
        address: addressA,
        amount: 50,
      },
    ],
    scenario: 'amount which is less than the minimum payment threshold',
    errorMessage: 'Amount is below the minimum payment threshold'
  },
]


