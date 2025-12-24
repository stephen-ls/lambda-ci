import { PaymentError } from 'src/errors/payment.error';
import { HttpClient } from 'src/server/http.client';

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  confirmations: number;
}

export interface AddressInfo {
  balance: number;
  unconfirmed_balance: number;
}

export interface TransactionInfo {
  confirmations: number;
  blockTime?: number;
}

export class NowNodesApi {
  private readonly httpClient: HttpClient;
  private readonly baseURL: string;
  private readonly accessKey: string;

  constructor(baseURL: string, accessKey: string) {
    this.httpClient = new HttpClient();
    this.accessKey = accessKey;
    this.baseURL = baseURL;
  }

  private getHeaders(): Record<string, string> {
    return {
      'api-key': this.accessKey,
      'Content-Type': 'application/json',
    };
  }

  async getUTXOs(address: string): Promise<UTXO[]> {
    const url = `${this.baseURL}/api/v2/utxo/${address}`;
    const data = await this.httpClient
      .get(url, this.getHeaders())
      .catch((err) => {
        throw new PaymentError('Failed to get UTXOs', { error: err });
      });

    return (data || [])
      .filter((utxo) => utxo.confirmations > 0)
      .map((utxo) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: Number(utxo.value),
        confirmations: utxo.confirmations,
      }));
  }

  async broadcastTransaction(txHex: string): Promise<string> {
    try {
      const url = `${this.baseURL}/api/v2/sendtx/${txHex}`;
      const data = await this.httpClient.get(url, this.getHeaders());

      if (data.result) {
        return data.result;
      }

      throw new PaymentError('Invalid broadcast response');
    } catch (err) {
      throw new PaymentError('Failed to broadcast transaction', { error: err });
    }
  }

  async getTransactionInfo(txId: string): Promise<TransactionInfo | null> {
    try {
      const url = `${this.baseURL}/api/v2/tx/${txId}`;
      return await this.httpClient.get(url, this.getHeaders());
    } catch (err: any) {
      if (err.message.includes('HTTP 404')) {
        return null;
      }
      throw err;
    }
  }

  async getAddressInfo(address: string): Promise<AddressInfo> {
    try {
      const url = `${this.baseURL}/api/v2/address/${address}`;
      const data = await this.httpClient.get(url, this.getHeaders());

      return {
        balance: parseInt(data.balance || '0', 10),
        unconfirmed_balance: parseInt(data.unconfirmedBalance || '0', 10),
      };
    } catch (err) {
      throw new PaymentError('Failed to get address info', { error: err });
    }
  }
}
