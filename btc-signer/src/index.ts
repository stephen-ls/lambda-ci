import {
  BitcoinService,
  BitcoinServiceOptions, Network,
} from 'src/btc.service';
import { PayBatchParams } from 'src/types/pay-batch-params.type';
import { PayBatchResponse } from 'src/types/pay-batch-response.type';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { PaymentError } from 'src/errors/payment.error';
import { validatePayBatchParams } from 'src/validator';

type CommandPayload = {
  data: PayBatchParams;
};

type CommandResponse = {
  result?: PayBatchResponse;
  error?: string[];
};

type SecretJson = {
  BTC_MNEMONIC: string
};

class BtcPaymentLambda {
  private secretsClient: SecretsManagerClient
  private readonly secretId: string;
  private readonly network: Network;

  constructor() {
    this.secretsClient = new SecretsManagerClient();
    this.secretId = process.env.BTC_SECRET_ID;
    this.network = process.env.BTC_NETWORK as Network;
  }

  public async handler(event: CommandPayload): Promise<CommandResponse> {
    const { data } = event;
    const error = validatePayBatchParams(event.data);
    if (error) return { error };
    
    console.log('An attempt to create and sign transaction at', new Date().toISOString());

    try {
      const secrets = await this.secretsClient.send(
        new GetSecretValueCommand({ SecretId: this.secretId })
      );
      
      if (!secrets.SecretString) {
        return { error: ['SecretString is empty, expected JSON in SecretString'] }
      }
      
      console.log('Secrets are here');
      
      const { BTC_MNEMONIC } = JSON.parse(secrets.SecretString) as SecretJson;
      const btcService = new BitcoinService({
        mnemonic: BTC_MNEMONIC,
        network: this.network,
      });
      
      console.log('Secrets are parsed');
      
      const payBatchResult = btcService.createAndSignTransaction(data);
      console.log('Signed successfully');
      
      return { result: payBatchResult };
    } catch (error) {
      console.log('Error inside index');
      console.log(error);
      return { error: [error instanceof PaymentError ? error.message : 'Unknown error'] };
    }
  }
}

const btcPaymentLambda = new BtcPaymentLambda();
export const handler = btcPaymentLambda.handler.bind(btcPaymentLambda);
