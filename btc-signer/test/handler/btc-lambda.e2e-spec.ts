import BIP32Factory from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { handler } from '../../src';
import { TestLambda } from '../test.lambda';
import { FeeEstimates, PayBatchParams, PayBatchRecipient, UTXO } from '../../src/types/pay-batch-params.type';
import {
  addressA,
  addressB,
  errorResponseSchema, invalidAddress,
  recommendedFees,
  successfulResponseSchema,
  utxos,
} from './btc-lambda.utils';
import { matchers } from 'jest-json-schema';
import { PaymentError } from '../../src/errors/payment.error';

type PartialPayBatchParams = {
  recipients?: Partial<PayBatchRecipient>[];
  utxos?: UTXO[];
  recommendedFees?: FeeEstimates;
}

const initializeWallet = (mnemonic: string): string => {
  const derivationPath = "m/84'/1'/0'/0/0";
  const network = bitcoin.networks.testnet;
  
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new PaymentError('Invalid mnemonic phrase');
  }
  const seedBuffer = bip39.mnemonicToSeedSync(mnemonic);
  
  const root = BIP32Factory(ecc).fromSeed(
    new Uint8Array(seedBuffer) as Buffer,
    network,
  );
  const keyPair = root.derivePath(derivationPath);
  
  const signer = {
    publicKey: Buffer.from(keyPair.publicKey),
    sign: (hash: Buffer): Buffer =>
      Buffer.from(ecc.sign(new Uint8Array(hash), keyPair.privateKey!)),
  };
  
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: signer.publicKey,
    network,
  });
  
  return address;
}

expect.extend(matchers);

describe('BTC Lambda (e2e)', () => {
  let testLambda: TestLambda;
  const endpoint = process.env.AWS_ENDPOINT_URL;
  const mnemonic = bip39.generateMnemonic(128);

  beforeAll(async () => {
    testLambda = new TestLambda(endpoint);
    await testLambda.init(mnemonic);
  });

  afterAll(async () => {
    await testLambda.stop();
  });

  describe('Successful transaction creation', () => {
    it.each([
      {
        recipients: [
          { address: addressA, amount: 10000 }
        ],
        scenario: 'a single recipient',
      },
      {
        recipients: [
          { address: addressA, amount: 10000 },
          { address: addressB, amount: 20000 }
        ],
        scenario: 'multiple recipients'
      },
    ])(
      'should create and sign a transaction with $scenario', async ({ recipients }) => {
        const expectedWalletAddress = initializeWallet(mnemonic);
        
        const testData: PayBatchParams = {
          recipients,
          utxos,
          recommendedFees,
        };
        
        const totalAmount = recipients.reduce(
          (acc, current) => acc + current.amount,
          0
        )
        
        const response = await handler({ data: testData });
        expect(response).toMatchSchema(successfulResponseSchema);
        const { result } = response;
        
        expect(result.recipientCount).toBe(recipients.length);
        expect(result.totalAmount).toBe(totalAmount);
        expect(result.fee).toBeGreaterThan(0);
        expect(result.walletAddress).toBe(expectedWalletAddress);
        
        const tx = bitcoin.Transaction.fromHex(result.txHex);
        const transactionOutputs = tx.outs.map(out => {
          const address = bitcoin.address.fromOutputScript(out.script, bitcoin.networks.testnet);
          return {
            address,
            value: out.value,
          };
        });
        
        const recipientOutputs = transactionOutputs.filter(out => 
          recipients.some(recipient => recipient.address === out.address)
        );
        expect(recipientOutputs.length).toBe(recipients.length);
        
        for (const recipient of recipients) {
          const output = recipientOutputs.find(out => out.address === recipient.address);
          expect(output).toBeDefined();
          expect(output!.value).toBe(recipient.amount);
        }
      }
    )
  });

  describe('Error handling', () => {
    it('should return error caught by validation function', async () => {
      const response = await handler({ data: {} });
      
      [
        'recipients must be a non-empty array',
        'utxos must be a non-empty array',
        'recommendedFees must be an object'
      ].forEach(error => expect(response.error).toContain(error));
    });
    
    it.each([
      {
        recipients: [{ address: addressA, amount: 100000 }],
        scenario: 'insufficient funds',
        error: 'Insufficient funds for batch payment'
      },
      {
        recipients: [{ address: invalidAddress, amount: 100000 }],
        scenario: 'invalid address',
        error: 'Invalid Bitcoin address'
      },
    ])(
      'should return error due to blockchain specific scenario: $scenario',
      async ({ recipients, error }) => {
        const testData: PartialPayBatchParams = {
          recipients,
          utxos,
          recommendedFees,
        };

        const response = await handler({ data: testData });
        expect(response).toMatchSchema(errorResponseSchema);
        expect(response.error).toContain(error);
      }
    )
  });
});
