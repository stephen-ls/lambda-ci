import { LocalStackHelper } from './utils/localstack.helper';

export type TestSecretConfig = {
  BTC_MNEMONIC: string;
  BTC_NETWORK: 'mainnet' | 'testnet';
};

export class TestLambda {
  private localStackHelper: LocalStackHelper;
  private secretId: string;

  constructor(endpoint: string) {
    this.localStackHelper = new LocalStackHelper(endpoint);
    this.secretId = process.env.AWS_SECRET_ID;
  }

  async init(secretConfig: TestSecretConfig): Promise<void> {
    await this.localStackHelper.createSecret(this.secretId, secretConfig);
    process.env.AWS_ENDPOINT_URL = this.localStackHelper.getEndpoint();
  }

  async stop(): Promise<void> {
    await this.localStackHelper.deleteSecret(this.secretId);
  }

  getSecretId(): string {
    return this.secretId;
  }
}
