# Lambda function for creating and signing BTC transactions

## Development installation

Run in terminal:
```
npm i && cp .env.sample .env
```
then update env variables.

If you want ot test real lambda, define a secret on AWS and put 
```
BTC_NETWORK=
BTC_MNEMONIC=
```

in the secret, also update `AWS_SECRET_ID` with secret name

In case of using of localstack define:
```
AWS_ENDPOINT_URL='http://localhost:4566'
```

## Production launch:

Define a secret on AWS and put variables:

```
BTC_NETWORK=
BTC_MNEMONIC=
```
there. Then add the following: 
```
AWS_REGION=<region>
AWS_ACCESS_KEY_ID=<aws access key id>
AWS_SECRET_ACCESS_KEY=< aws secret access key>
AWS_SECRET_ID_DEV=<dev_secret_name>
AWS_SECRET_ID_PROD=<prod_secret_name>
```
on github actions secrets