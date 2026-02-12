import BIP32Factory, { BIP32Interface } from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { PaymentError } from 'src/errors/payment.error';
import {
  PayBatchParams,
  PayBatchRecipient,
  FeeEstimates,
  UTXO,
} from 'src/types/pay-batch-params.type';
import { PayBatchResponse } from 'src/types/pay-batch-response.type';
import * as ecc from 'tiny-secp256k1';

const BTC_CONFIG = {
  CHANGE_DUST_LIMIT_SAT: 294,
  FALLBACK_FEE_RATES: {
    mainnet: 5,
    testnet: 1,
  },
  TX_SIZE_ESTIMATES: {
    inputVBytes: 68,
    outputVBytes: 31,
    overheadVBytes: 11,
  },
  CONFIRMATIONS: {
    required: 2,
  },
} as const;

export type Network = 'mainnet' | 'testnet';

export type BitcoinServiceOptions = {
  mnemonic: string;
  network: Network;
};

export class BitcoinService {
  private network: bitcoin.Network;
  private keyPair: BIP32Interface;
  private signer: bitcoin.Signer;
  private walletAddress: string;

  private readonly fallbackFeeRate: number;

  constructor(options: BitcoinServiceOptions) {
    const isTestnet = options.network === 'testnet';
    const derivationPath = isTestnet ? "m/84'/1'/0'/0/0" : "m/84'/0'/0'/0/0";

    this.network = isTestnet
      ? bitcoin.networks.testnet
      : bitcoin.networks.bitcoin;
    
    this.initializeWallet(options.mnemonic, derivationPath);

    this.fallbackFeeRate = isTestnet
      ? BTC_CONFIG.FALLBACK_FEE_RATES.testnet
      : BTC_CONFIG.FALLBACK_FEE_RATES.mainnet;
  }

  createAndSignTransaction(params: PayBatchParams): PayBatchResponse {
    const { recipients, utxos } = params;
    try {
      if (!recipients || recipients.length === 0) {
        throw new PaymentError('No recipients provided');
      }

      let totalAmount = 0;

      for (const recipient of recipients) {
        this.validatePayParams(recipient.address, recipient.amount);
        totalAmount += recipient.amount;
      }
      
      const { change, fee } = this.estimateChangeAndFeeOrFail(params);

      const psbt = this.buildTransaction(utxos, recipients, change);

      psbt.signAllInputs(this.signer);
      psbt.finalizeAllInputs();
      const extracted = psbt.extractTransaction();
      const txHex = extracted.toHex();
      const txId = extracted.getId();

      return {
        txHex,
        txId,
        recipientCount: recipients.length,
        fee,
        totalAmount,
        walletAddress: this.walletAddress
      };
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }
      throw new PaymentError('Batch payment failed', { error });
    }
  }

  private buildTransaction(
    utxos: UTXO[],
    recipients: PayBatchRecipient[],
    change: number,
  ) {
    const psbt = new bitcoin.Psbt({ network: this.network });
    for (const utxo of utxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: bitcoin.address.toOutputScript(
            this.walletAddress,
            this.network,
          ),
          value: utxo.value,
        },
      });
    }

    for (const recipient of recipients) {
      psbt.addOutput({
        address: recipient.address,
        value: recipient.amount,
      });
    }

    if (change > BTC_CONFIG.CHANGE_DUST_LIMIT_SAT) {
      psbt.addOutput({
        address: this.walletAddress,
        value: change,
      });
    }
    return psbt;
  }

  private estimateChangeAndFeeOrFail(
    params: PayBatchParams,
  ): { change: number; fee: number } {
    const { utxos, recipients, recommendedFees } = params;
    const totalInput = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);

    let numOutputs = recipients.length + 1;
    let fee = this.estimateFee(utxos.length, numOutputs, recommendedFees);
    let change = totalInput - totalAmount - fee;

    if (change > 0 && change <= BTC_CONFIG.CHANGE_DUST_LIMIT_SAT) {
      numOutputs = recipients.length;
      fee = this.estimateFee(utxos.length, numOutputs, recommendedFees);
      change = 0;
    }

    const totalNeeded = totalAmount + fee;

    if (totalInput < totalNeeded) {
      throw new PaymentError('Insufficient funds for batch payment', {
        availableSat: totalInput,
        requiredSat: totalNeeded,
        totalAmountSat: totalAmount,
        feeInSat: fee,
        recipientCount: recipients.length,
      });
    }

    return { change, fee };
  }

  private estimateFee(
    numInputs: number,
    numOutputs: number,
    recommendedFees: FeeEstimates,
  ): number {
    const estimatedVSize =
      numInputs * BTC_CONFIG.TX_SIZE_ESTIMATES.inputVBytes +
      numOutputs * BTC_CONFIG.TX_SIZE_ESTIMATES.outputVBytes +
      BTC_CONFIG.TX_SIZE_ESTIMATES.overheadVBytes;

    try {
      const feeRate =
        recommendedFees.halfHourFee ||
        recommendedFees.hourFee ||
        this.fallbackFeeRate;
      return estimatedVSize * feeRate;
    } catch (error) {
      return estimatedVSize * this.fallbackFeeRate;
    }
  }

  private validatePayParams(address: string, amountInSat: number): void {
    try {
      bitcoin.address.toOutputScript(address, this.network);
    } catch {
      throw new PaymentError('Invalid Bitcoin address');
    }
  }

  private initializeWallet(mnemonic: string, derivationPath: string): void {
    try {
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new PaymentError('Invalid mnemonic phrase');
      }
      const seedBuffer = bip39.mnemonicToSeedSync(mnemonic);

      const root = BIP32Factory(ecc).fromSeed(
        new Uint8Array(seedBuffer) as Buffer,
        this.network,
      );
      this.keyPair = root.derivePath(derivationPath);

      this.signer = {
        publicKey: Buffer.from(this.keyPair.publicKey),
        sign: (hash: Buffer): Buffer =>
          Buffer.from(ecc.sign(new Uint8Array(hash), this.keyPair.privateKey!)),
      };

      const { address } = bitcoin.payments.p2wpkh({
        pubkey: this.signer.publicKey,
        network: this.network,
      });

      if (!address) {
        throw new PaymentError('Failed to generate wallet address');
      }
      
      this.walletAddress = address;
    } catch (error) {
      throw new PaymentError('Failed to initialize wallet', { error });
    }
  }
}
