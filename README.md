# Lambda function for creating and signing transactions

## BTC

### Prerequisites

 - AWS lambda already up and running
 - Secret created on AWS
 - BTC wallet (mnemonic)
 - Docker (only for testing)

Before any command make sure you're in the correct directory:
```bash
cd btc-signer
```

### Building and updating lambda on AWS

Run in terminal:
```bash
./build.sh
```
The script creates a zip can be used for the lambda codebase update (via cli for instance).

Then update the secret on AWS with variables using mnemonic of your BTC wallet and network (can be `testnet` or `mainnet`):
```
BTC_NETWORK=
BTC_MNEMONIC=
```

Then update lambda config with the following env variables using the existing secret id:
```
AWS_SECRET_ID=
```

### Adding or updating vendor dependencies

Add or update the desired library in the `package.vendor.json` file, then run:
```bash
./vendor-libs.sh
```

### Testing

Run in terminal:
```bash
npm i
```

Create an `.env` file from the example.
```bash
cp .env.example .env
```
and fill in the values of the AWS credentials. Then run:
```bash
npm run test:e2e
```

### Creating BTC wallet in testnet

Run in terminal:
```bash
node wallet.js
```