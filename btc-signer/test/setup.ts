import { LocalstackContainer, StartedLocalStackContainer } from '@testcontainers/localstack';
import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.resolve(__dirname, '../.env.test') });
config({ path: path.resolve(__dirname, '../.env') });

const setup = async () => {
  await initLocalStack();
};

const initLocalStack = async () => {
  const localStackContainer = await new LocalstackContainer('localstack/localstack')
    .withEnvironment({ SERVICES: 'secretsmanager' })
    .withExposedPorts(4566)
    .start();

  process.env.AWS_ENDPOINT_URL = localStackContainer.getConnectionUri();
  global.localStackContainer = localStackContainer;
};

declare global {
  var localStackContainer: StartedLocalStackContainer;
}

export default setup;
