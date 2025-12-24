import 'dotenv/config';
import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { PayBatchParams } from 'src/types/pay-batch-params.type';
import { NowNodesApi } from 'src/server/nownodes.api';
import { MempoolApi } from 'src/server/mempool.api';
import swaggerSpec from 'src/server/swagger.config';
import { PaymentError } from 'src/errors/payment.error';
import { handler } from 'src/index';
import { ActionType } from 'src/types/action-type.enum';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

type UTXO = {
  txid: string;
  vout: number;
  value: number;
  confirmations: number;
};

type PayRequestBody = {
  action: string;
  data: Pick<PayBatchParams, 'recipients'>;
  useLambda?: boolean
};

type PayResponseBody = {
  result: unknown;
  error?: string;
};

const nowNodesApi = new NowNodesApi(process.env.NOWNODES_API, process.env.NOWNODES_ACCESS_KEY);
const mempoolApi = new MempoolApi(process.env.BTC_NETWORK === 'testnet');

const getUTXOsOrFail = async (): Promise<UTXO[]> => {
  const utxos = await nowNodesApi.getUTXOs(process.env.BTC_PUBLIC_KEY);
  if (!utxos || !utxos.length) {
    throw new PaymentError('No UTXOs available - wallet is empty');
  }
  return utxos;
}

const app = express();
app.use(express.json());

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post(
  '/pay',
  async (req: Request<unknown, unknown, PayRequestBody>, res: Response<PayResponseBody>) => {
    try {
      const { data, useLambda } = req.body;

      const [utxos, recommendedFees] = await Promise.all([
        getUTXOsOrFail(),
        mempoolApi.getRecommendedFees(),
      ]);

      const handlerData = { action: ActionType.btcPayBatch, data: { recommendedFees, utxos, ...data }};
      let handlerResult;
      
      if (useLambda) {
        const lambdaClient = new LambdaClient({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
          },
          endpoint: process.env.AWS_ENDPOINT_URL
        });

        const invokeResp = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: process.env.AWS_LAMBDA_NAME,
            InvocationType: 'RequestResponse',
            Payload: Buffer.from(JSON.stringify(handlerData)),
          })
        );
        
        const payloadBuffer = invokeResp.Payload
          ? Buffer.from(invokeResp.Payload)
          : null;
        
        if (!payloadBuffer) {
          throw new Error('Lambda returned empty payload');
        }
        
        handlerResult = JSON.parse(payloadBuffer.toString("utf-8"));
      } else {
        handlerResult = await handler(handlerData);
      }
      
      const { result, error } = handlerResult

      if (error) throw new Error(error);

      return res.json({ result });
    } catch (err) {
      console.log(err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  },
);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
  console.log(`Swagger available at http://localhost:${port}/swagger`);
});
