import {
  CreateSecretCommand,
  SecretsManagerClient,
  PutSecretValueCommand,
  DeleteSecretCommand,
} from '@aws-sdk/client-secrets-manager';

export class LocalStackHelper {
  private secretsClient: SecretsManagerClient;
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.secretsClient = new SecretsManagerClient({
      endpoint: endpoint,
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async createSecret(secretId: string, secretValue: object): Promise<void> {
    try {
      await this.secretsClient.send(
        new CreateSecretCommand({
          Name: secretId,
          SecretString: JSON.stringify(secretValue),
        }),
      );
    } catch (error: any) {
      if (error.name === 'ResourceExistsException') {
        await this.secretsClient.send(
          new PutSecretValueCommand({
            SecretId: secretId,
            SecretString: JSON.stringify(secretValue),
          }),
        );
      } else {
        throw error;
      }
    }
  }

  async deleteSecret(secretId: string): Promise<void> {
    try {
      await this.secretsClient.send(
        new DeleteSecretCommand({
          SecretId: secretId,
          ForceDeleteWithoutRecovery: true,
        }),
      );
    } catch (error: any) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }
  }

  getEndpoint(): string {
    return this.endpoint;
  }
}
