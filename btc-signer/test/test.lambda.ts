import * as bip39 from 'bip39';
import { LocalStackHelper } from './utils/localstack.helper';


export class TestLambda {
  private localStackHelper: LocalStackHelper;
  private secretId: string;

  constructor(endpoint: string) {
    this.localStackHelper = new LocalStackHelper(endpoint);
    this.secretId = process.env.BTC_SECRET_ID;
  }

  async init(mnemonic: string): Promise<void> {
    await this.localStackHelper.createSecret(this.secretId, {
      BTC_MNEMONIC: mnemonic,
    });
    process.env.AWS_ENDPOINT_URL = this.localStackHelper.getEndpoint();
  }

  async stop(): Promise<void> {
    await this.localStackHelper.deleteSecret(this.secretId);
  }

  getSecretId(): string {
    return this.secretId;
  }
}
