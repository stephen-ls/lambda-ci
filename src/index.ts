import {
  BitcoinService,
  BitcoinServiceOptions,
} from 'src/btc.service';
import { ActionType } from 'src/types/action-type.enum';
import { PayBatchParams } from 'src/types/pay-batch-params.type';
import { PayBatchResponse } from 'src/types/pay-batch-response.type';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

type CommandPayload = {
  action: ActionType;
  data: unknown;
};

type CommandResponse = {
  result?: PayBatchResponse;
  error?: string;
};

type SecretJson = {
  BTC_MNEMONIC: string,
  BTC_NETWORK: BitcoinServiceOptions['network']
};

class BtcPaymentLambda {
  private secretsClient: SecretsManagerClient
  private secretId: string;

  constructor() {
    const endpoint = this.getAWSEndpoint();
    const config = endpoint ? {
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      endpoint
    } : { region: process.env.AWS_REGION };

    this.secretsClient = new SecretsManagerClient(config);
    this.secretId = process.env.AWS_SECRET_ID;
  }
  
  private getAWSEndpoint(): string {
    if (process.env.LOCALSTACK_HOSTNAME) {
      return `http://${process.env.LOCALSTACK_HOSTNAME}:4566`;
    }
    
    if (process.env.AWS_ENDPOINT_URL) return process.env.AWS_ENDPOINT_URL;
  }

  public async handler(event: CommandPayload): Promise<CommandResponse> {
    const { action, data } = event;

    console.log('Action:', action);

    try {
      switch (action) {
        case ActionType.btcPayBatch:
          const secrets = await this.secretsClient.send(
            new GetSecretValueCommand({ SecretId: this.secretId })
          );
          
          console.log('Secrets are received')
          
          if (!secrets.SecretString) {
            return { error: 'SecretString is empty, expected JSON in SecretString' }
          }
          
          const { BTC_MNEMONIC, BTC_NETWORK } = JSON.parse(secrets.SecretString) as SecretJson;
          const btcService = new BitcoinService({
            mnemonic: BTC_MNEMONIC,
            network: BTC_NETWORK as BitcoinServiceOptions['network'],
          });
          
          console.log('BTC service is initialized');

          const payBatchResult = btcService.createAndSignTransaction(
            data as PayBatchParams,
          );

          return { result: payBatchResult };

        default:
          return { error: `Unknown action: ${action}` }
      }
    } catch (error) {
      return { error: error.message || 'Unknown error' };
    }
  }
}

const btcPaymentLambda = new BtcPaymentLambda();
export const handler = btcPaymentLambda.handler.bind(btcPaymentLambda);
