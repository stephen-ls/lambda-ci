import { HttpClient } from 'src/server/http.client';

export interface FeeEstimates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  minimumFee: number;
}

export class MempoolApi {
  private readonly httpClient: HttpClient;
  private readonly baseURL: string;

  constructor(isTestnet: boolean) {
    this.httpClient = new HttpClient();
    this.baseURL = isTestnet
      ? 'https://mempool.space/testnet/api'
      : 'https://mempool.space/api';
  }

  async getRecommendedFees(): Promise<FeeEstimates> {
    const url = `${this.baseURL}/v1/fees/recommended`;
    return await this.httpClient.get(url);
  }
}
